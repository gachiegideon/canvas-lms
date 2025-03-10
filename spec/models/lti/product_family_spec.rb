# frozen_string_literal: true

#
# Copyright (C) 2014 - present Instructure, Inc.
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

module Lti
  describe ProductFamily do
    let(:account) { Account.new }

    describe "validations" do
      before do
        subject.vendor_code = "vendor_code"
        subject.product_code = "product_code"
        subject.vendor_name = "vendor_name"
        subject.root_account_id = account
      end

      it "requires a vendor_code" do
        subject.vendor_code = nil
        subject.save
        expect(subject.errors[:vendor_code].first).to eq "can't be blank"
      end

      it "requires a product_code" do
        subject.product_code = nil
        subject.save
        expect(subject.errors[:product_code].first).to eq "can't be blank"
      end

      it "requires a vendor_name" do
        subject.vendor_name = nil
        subject.save
        expect(subject.errors[:vendor_name].first).to eq "can't be blank"
      end

      it "requires a root_account" do
        subject.root_account = nil
        subject.save
        expect(subject.errors[:root_account].first).to eq "can't be blank"
      end

      it "requires unique productcode,vendorcode,rootaccount,developerkey combo" do
        dev_key = DeveloperKey.create(api_key: "testapikey")
        subject.update(developer_key: dev_key, root_account: account)
        dup_subject = subject.dup
        dup_subject.save
        expect(dup_subject.errors[:product_code].first).to eq "has already been taken"
      end
    end
  end
end
