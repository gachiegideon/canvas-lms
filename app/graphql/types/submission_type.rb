# frozen_string_literal: true

#
# Copyright (C) 2018 - present Instructure, Inc.
#
# This file is part of Canvas.
#
# Canvas is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by the Free
# Software Foundation, version 3 of the License.
#
# Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License along
# with this program. If not, see <http://www.gnu.org/licenses/>.
#

#############################################################################
# NOTE: In most cases you shouldn't add new fields here, instead they should
#       be added to interfaces/submission_interface.rb so that they work for
#       both submissions and submission histories
#############################################################################

module Types
  class SubmissionHistoryFilterInputType < Types::BaseInputObject
    graphql_name "SubmissionHistoryFilterInput"

    argument :states,
             [SubmissionStateType],
             required: false,
             default_value: DEFAULT_SUBMISSION_HISTORY_STATES

    argument :include_current_submission, Boolean, <<~MD, required: false, default_value: true
      If the most current submission should be included in the submission
      history results. Defaults to true.
    MD
  end

  class SubmissionType < ApplicationObjectType
    graphql_name "Submission"

    include GraphQLHelpers::AnonymousGrading

    implements GraphQL::Types::Relay::Node
    implements Interfaces::TimestampInterface
    implements Interfaces::SubmissionInterface
    implements Interfaces::LegacyIDInterface

    def initialize(object, context)
      super
      anonymous_grading_scoped_context(object)
    end

    global_id_field :id

    field :read_state, String, null: true
    def read_state
      object.read_state(current_user)
    end

    field :grading_period_id, ID, null: true

    field :student_entered_score, Float, null: true

    field :redo_request, Boolean, null: true

    field :user_id, ID, null: true
    def user_id
      unless_hiding_user_for_anonymous_grading { object.user_id }
    end

    field :anonymous_id, ID, null: true

    field :enrollments_connection, EnrollmentType.connection_type, null: true
    def enrollments_connection
      load_association(:course).then do |course|
        return nil unless course.grants_any_right?(
          current_user,
          session,
          :read_roster,
          :view_all_grades,
          :manage_grades
        )

        scope = course.apply_enrollment_visibility(course.all_enrollments, current_user, include: :inactive)
        scope.where(user_id: submission.user_id)
      end
    end

    field :submission_histories_connection, SubmissionHistoryType.connection_type, null: true do
      argument :filter, SubmissionHistoryFilterInputType, required: false, default_value: {}
    end
    def submission_histories_connection(filter:)
      filter = filter.to_h
      filter => states:, include_current_submission:
      Promise.all([
                    load_association(:versions),
                    load_association(:assignment)
                  ]).then do
        histories = object.submission_history
        histories.pop unless include_current_submission
        histories.select { |h| states.include?(h.workflow_state) }
      end
    end

    field :sub_assignment_tag, String, null: true
    def sub_assignment_tag
      return object.assignment.sub_assignment_tag if object.assignment.is_a?(SubAssignment)

      nil
    end
  end
end
