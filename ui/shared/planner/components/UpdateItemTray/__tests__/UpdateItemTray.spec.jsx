/*
 * Copyright (C) 2017 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */
import moment from 'moment-timezone'
import React from 'react'
import {within, render, fireEvent} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {shallow} from 'enzyme'
import {UpdateItemTray_ as UpdateItemTray} from '../index'

jest.useFakeTimers()

const defaultProps = {
  onSavePlannerItem: () => {},
  locale: 'en',
  timeZone: 'Asia/Tokyo',
  onDeletePlannerItem: () => {},
  courses: [],
  noteItem: {},
}

const simpleItem = (opts = {}) => ({
  uniqueId: '1',
  title: '',
  date: moment('2017-04-28T11:00:00Z'),
  ...opts,
})

let ariaLive

beforeAll(() => {
  ariaLive = document.createElement('div')
  ariaLive.id = 'flash_screenreader_holder'
  ariaLive.setAttribute('role', 'alert')
  document.body.appendChild(ariaLive)
})

afterAll(() => {
  if (ariaLive) ariaLive.remove()
})

afterEach(() => {
  jest.restoreAllMocks()
  document.body.innerHTML = ''
})

it('renders the item to update if provided', () => {
  const noteItem = {
    uniqueId: '1',
    title: 'Planner Item',
    date: moment('2017-04-25 01:49:00-0700'),
    context: {id: '1'},
    details: 'You made this item to remind you of something, but you forgot what.',
  }
  const wrapper = shallow(
    <UpdateItemTray
      {...defaultProps}
      noteItem={noteItem}
      courses={[
        {id: '1', longName: 'a course', enrollmentType: 'StudentEnrollment'},
        {id: '2', longName: 'a course I teach', enrollmentType: 'TeacherEnrollment'},
      ]}
    />,
  )
  expect(wrapper).toMatchSnapshot()
})

it("doesn't re-render unless new item is provided", () => {
  const wrapper = shallow(<UpdateItemTray {...defaultProps} />)
  const newProps = {...defaultProps, locale: 'fr'}
  wrapper.setProps(newProps)
  expect(wrapper.find('DateTimeInput').props().messages).toHaveLength(0)
})

it('renders Add To Do header when creating a new to do', async () => {
  const {getByText} = render(<UpdateItemTray {...defaultProps} />)
  const h2 = await getByText('Add To Do')
  expect(h2).toBeInTheDocument()
  expect(h2.tagName).toBe('H2')
})

it('shows title inputs', async () => {
  const user = userEvent.setup({delay: null})
  const {getAllByRole} = render(<UpdateItemTray {...defaultProps} />)
  const input = getAllByRole('textbox')[0]
  await user.type(input, 'New Text')
  expect(input).toHaveValue('New Text')
})

it('shows details inputs', async () => {
  const user = userEvent.setup({delay: null})
  const {getAllByRole} = render(<UpdateItemTray {...defaultProps} />)
  const input = getAllByRole('textbox')[0]
  await user.type(input, 'New Details')
  expect(input).toHaveValue('New Details')
})

it('disables the save button when title is empty', () => {
  const item = simpleItem()
  const wrapper = shallow(<UpdateItemTray {...defaultProps} noteItem={item} />)
  const button = wrapper.find('Button[color="primary"]')
  expect(button.props().interaction).toBe('disabled')
})

it('handles courseid being none', () => {
  const item = simpleItem()
  const wrapper = shallow(<UpdateItemTray {...defaultProps} noteItem={item} />)
  wrapper.instance().handleCourseIdChange({}, {value: 'none'})
  expect(wrapper.instance().state.updates.courseId).toBe(undefined)
})

it('correctly updates id to null when courseid is none', () => {
  const item = simpleItem()
  const mockCallback = jest.fn()
  const wrapper = shallow(
    <UpdateItemTray {...defaultProps} onSavePlannerItem={mockCallback} noteItem={item} />,
  )
  wrapper.instance().handleCourseIdChange({}, {value: 'none'})
  wrapper.instance().handleSave()
  expect(mockCallback).toHaveBeenCalledWith({
    uniqueId: '1',
    title: item.title,
    date: item.date.toISOString(),
    context: {
      id: null,
    },
  })
})

it('sets default datetime to 11:50pm today when no date is provided', () => {
  const now = moment.tz(defaultProps.timeZone).endOf('day')
  const item = {title: 'an item', date: ''}
  const wrapper = shallow(<UpdateItemTray {...defaultProps} noteItem={item} />)
  const datePicker = wrapper.find('DateTimeInput')
  expect(datePicker.props().value).toEqual(now.toISOString())
})

it('enables the save button when title and date are present', () => {
  const item = simpleItem({title: 'an item'})
  const wrapper = shallow(<UpdateItemTray {...defaultProps} noteItem={item} />)
  const button = wrapper.find('Button[color="primary"]')
  expect(button.props().interaction).toBe('enabled')
})

it('does not set an initial error message on title', () => {
  const wrapper = shallow(<UpdateItemTray {...defaultProps} />)
  const titleInput = wrapper.find('TextInput').first()
  expect(titleInput.props().messages).toEqual([])
})

it('sets error message on title field when title is set to blank', () => {
  const wrapper = shallow(
    <UpdateItemTray {...defaultProps} noteItem={{uniqueId: '1', title: 'an item'}} />,
  )
  wrapper.instance().handleTitleChange({target: {value: ''}})
  const titleInput = wrapper.find('TextInput').first()
  const messages = titleInput.props().messages
  expect(messages).toHaveLength(1)
  expect(messages[0].type).toBe('error')
})

it('clears the error message when a title is typed in', () => {
  const wrapper = shallow(
    <UpdateItemTray {...defaultProps} noteItem={{uniqueId: '1', title: 'an item'}} />,
  )
  wrapper.instance().handleTitleChange({target: {value: ''}})
  wrapper.instance().handleTitleChange({target: {value: 't'}})
  const titleInput = wrapper.find('TextInput').first()
  expect(titleInput.props().messages).toEqual([])
})

// The Date picker does not support error handling yet we are working with instui to get it working
// TODO: Needs ticket
it.skip('does not set an initial error message on date', () => {
  const wrapper = shallow(<UpdateItemTray {...defaultProps} />)
  const dateInput = wrapper.find('TextInput').at(1)
  expect(dateInput.props().messages).toEqual([])
})

// TODO: Needs ticket
it.skip('sets error message on date field when date is set to blank', () => {
  const wrapper = shallow(<UpdateItemTray {...defaultProps} noteItem={simpleItem()} />)
  wrapper.instance().handleDateChange({target: {value: ''}})
  const dateInput = wrapper.find('TextInput').at(1)
  const messages = dateInput.props().messages
  expect(messages).toHaveLength(1)
  expect(messages[0].type).toBe('error')
})

// TODO: Needs ticket
it.skip('clears the error message when a date is typed in', () => {
  const wrapper = shallow(<UpdateItemTray {...defaultProps} noteItem={simpleItem()} />)
  wrapper.instance().handleTitleChange({target: {value: ''}})
  wrapper.instance().handleTitleChange({target: {value: '2'}})
  const dateInput = wrapper.find('TextInput').at(1)
  expect(dateInput.props().messages).toEqual([])
})

it('respects the provided timezone', () => {
  const item = simpleItem({date: moment('2017-04-25 12:00:00-0300')})
  const wrapper = render(<UpdateItemTray {...defaultProps} noteItem={item} />)
  // DateInput internally renders 3 TextInputs, we only need the first
  const dateInput = wrapper.getByDisplayValue('April 26, 2017')
  expect(dateInput).toBeInTheDocument()
})

it.skip('changes state when new date is typed in', async () => {
  // TODO: figure out why typing into dateInput never resolves
  const noteItem = simpleItem({title: 'Planner Item'})
  const mockCallback = jest.fn()
  const wrapper = render(
    <UpdateItemTray {...defaultProps} onSavePlannerItem={mockCallback} noteItem={noteItem} />,
  )
  const newDate = moment('2017-10-16T13:30:00')

  const dateInput = await wrapper.getByLabelText('Date')
  await userEvent.type(dateInput, newDate.format('YYYY-MM-DD'))

  const timeInput = await wrapper.getByLabelText('Time')
  await userEvent.type(timeInput, newDate.format('HH:mm A'))

  const saveButton = await wrapper.findByTestId('save')
  await userEvent.click(saveButton)

  expect(mockCallback).toHaveBeenCalledWith({
    uniqueId: '1',
    title: noteItem.title,
    date: newDate.toISOString(),
    context: {id: null},
  })
})

it('updates state when new note is passed in', () => {
  const noteItem1 = simpleItem({
    title: 'Planner Item 1',
    context: {id: '1'},
    details: 'You made this item to remind you of something, but you forgot what.',
  })
  const wrapper = shallow(
    <UpdateItemTray
      {...defaultProps}
      noteItem={noteItem1}
      courses={[
        {id: '1', longName: 'first course', enrollmentType: 'StudentEnrollment'},
        {id: '2', longName: 'second course', enrollmentType: 'StudentEnrollment'},
      ]}
    />,
  )
  expect(wrapper).toMatchSnapshot()

  const noteItem2 = simpleItem({
    uniqueId: '2',
    title: 'Planner Item 2',
    context: {id: '2'},
    details: 'This is another reminder',
  })
  wrapper.setProps({noteItem: noteItem2})
  expect(wrapper).toMatchSnapshot()
})

it('does not update state when the new note property is equal to the previous note property', () => {
  const note = simpleItem({title: 'original title'})
  const wrapper = shallow(<UpdateItemTray {...defaultProps} noteItem={note} courses={[]} />)
  let titleInput = wrapper.find('TextInput').first()
  expect(titleInput.props().value).toBe('original title')

  titleInput.props().onChange({target: {value: 'new title'}})
  titleInput = wrapper.find('TextInput').first()
  expect(titleInput.props().value).toBe('new title')

  wrapper.setProps({noteItem: {...note}}) // new object, same content as original
  titleInput = wrapper.find('TextInput').first()
  expect(titleInput.props().value).toBe('new title')
})

//------------------------------------------------------------------------

it('does not render the delete button if an item is not specified', () => {
  const wrapper = shallow(<UpdateItemTray {...defaultProps} />)
  const deleteButton = wrapper.find('Button[variant="light"]')
  expect(deleteButton).toHaveLength(0)
})

it('does render the delete button if an item is specified', () => {
  const wrapper = shallow(
    <UpdateItemTray {...defaultProps} noteItem={{uniqueId: '1', title: 'some note'}} />,
  )
  const deleteButton = wrapper.find('Button[color="primary-inverse"]')
  expect(deleteButton).toHaveLength(1)
})

it('renders just an optional option when no courses', async () => {
  const user = userEvent.setup({delay: null})
  const {getByTitle, getByRole} = render(<UpdateItemTray {...defaultProps} />)
  const option = getByTitle('Optional: Add Course')
  await user.click(option)
  const listbox = getByRole('listbox', {hidden: true})
  const {getAllByRole} = within(listbox)
  const listItems = getAllByRole('option')
  expect(listItems).toHaveLength(1)
})

it('renders course options plus an optional option when provided with courses', async () => {
  const user = userEvent.setup({delay: null})
  const {getByTitle, getByRole} = render(
    <UpdateItemTray
      {...defaultProps}
      courses={[
        {id: '1', longName: 'first course', enrollmentType: 'StudentEnrollment'},
        {id: '2', longName: 'second course', enrollmentType: 'StudentEnrollment'},
      ]}
    />,
  )
  const option = getByTitle('Optional: Add Course')
  await user.click(option)
  const listbox = getByRole('listbox', {hidden: true})
  const {getAllByRole} = within(listbox)
  const listItems = getAllByRole('option')
  expect(listItems).toHaveLength(3)
})

it('invokes save callback with updated data', () => {
  const saveMock = jest.fn()
  const wrapper = shallow(
    <UpdateItemTray
      {...defaultProps}
      noteItem={{
        uniqueId: '1',
        title: 'title',
        date: moment('2017-04-27T13:00:00Z'),
        courseId: '42',
        details: 'details',
      }}
      courses={[
        {id: '42', longName: 'first', enrollmentType: 'StudentEnrollment'},
        {id: '43', longName: 'second', enrollmentType: 'StudentEnrollment'},
      ]}
      onSavePlannerItem={saveMock}
    />,
  )
  wrapper.instance().handleTitleChange({target: {value: 'new title'}})
  wrapper.instance().handleDateChange({}, '2017-05-01T14:00:00Z')
  wrapper.instance().handleCourseIdChange(null, {value: '43'})
  wrapper.instance().handleChange('details', 'new details')
  wrapper.instance().handleSave()
  expect(saveMock).toHaveBeenCalledWith({
    uniqueId: '1',
    title: 'new title',
    date: moment('2017-05-01T14:00:00Z').toISOString(),
    context: {id: '43'},
    details: 'new details',
  })
})

it('invokes the delete callback', () => {
  const item = simpleItem({title: 'a title'})
  const mockDelete = jest.fn()
  const wrapper = shallow(
    <UpdateItemTray {...defaultProps} noteItem={item} onDeletePlannerItem={mockDelete} />,
  )
  const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
  wrapper.instance().handleDeleteClick()
  expect(confirmSpy).toHaveBeenCalled()
  expect(mockDelete).toHaveBeenCalledWith(item)
})

it.skip('invokes invalidDateTimeMessage when an invalid date is entered', async () => {
  // TODO: figure out why typing into dateInput never resolves
  const invalidCallbackSpy = jest.spyOn(UpdateItemTray.prototype, 'invalidDateTimeMessage')
  const user = userEvent.setup({delay: 0})
  const wrapper = render(<UpdateItemTray {...defaultProps} />)

  const dateInput = await wrapper.findByLabelText('Date')
  await user.type(dateInput, 'x{Tab}')
  jest.runOnlyPendingTimers()
  expect(invalidCallbackSpy).toHaveBeenCalled()
})
