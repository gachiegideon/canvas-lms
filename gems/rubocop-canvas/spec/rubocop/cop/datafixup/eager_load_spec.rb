# frozen_string_literal: true

#
# Copyright (C) 2016 - present Instructure, Inc.
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

describe RuboCop::Cop::Datafixup::EagerLoad do
  subject(:cop) { described_class.new }

  it "disallows eager_load" do
    offenses = inspect_source(%{
      module DataFixup::RecomputeRainbowAsteroidField
        def self.run
          AccountUser.eager_load(:account)
        end
      end
    })
    expect(offenses.size).to eq(1)
    expect(offenses.first.message).to match(/eager_load/)
    expect(offenses.first.severity.name).to eq(:error)
  end
end
