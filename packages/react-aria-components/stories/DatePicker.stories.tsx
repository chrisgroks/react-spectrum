/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {action} from '@storybook/addon-actions';
import {Button, Calendar, CalendarCell, CalendarGrid, DateInput, DatePicker, DateRangePicker, DateSegment, Dialog, Form, Group, Heading, Input, Label, Popover, RangeCalendar, TextField} from 'react-aria-components';
import clsx from 'clsx';
import {Meta, StoryFn} from '@storybook/react';
import React from 'react';
import styles from '../example/index.css';
import './styles.css';

export default {
  title: 'React Aria Components/DatePicker',
  component: DatePicker,
  argTypes: {
    onChange: {
      table: {
        disable: true
      }
    },
    granularity: {
      control: 'select',
      options: ['day', 'hour', 'minute', 'second']
    },
    isRequired: {
      control: 'boolean'
    },
    isInvalid: {
      control: 'boolean'
    },
    isDisabled: {
      control: 'boolean'
    },
    isReadOnly: {
      control: 'boolean'
    },
    validationBehavior: {
      control: 'select',
      options: ['native', 'aria']
    }
  }
} as Meta<typeof DatePicker>;

export type DatePickerStory = StoryFn<typeof DatePicker>;
export type DateRangePickerStory = StoryFn<typeof DateRangePicker>;

export const DatePickerExample: DatePickerStory = (args) => (
  <DatePicker data-testid="date-picker-example" {...args}>
    <Label style={{display: 'block'}}>Date</Label>
    <Group style={{display: 'inline-flex'}}>
      <DateInput className={styles.field}>
        {segment => <DateSegment segment={segment} className={clsx(styles.segment, {[styles.placeholder]: segment.isPlaceholder})} />}
      </DateInput>
      <Button>🗓</Button>
    </Group>
    <Popover
      placement="bottom start"
      style={{
        background: 'Canvas',
        color: 'CanvasText',
        border: '1px solid gray',
        padding: 20
      }}>
      <Dialog>
        <Calendar style={{width: 220}}>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <Button slot="previous">&lt;</Button>
            <Heading style={{flex: 1, textAlign: 'center'}} />
            <Button slot="next">&gt;</Button>
          </div>
          <CalendarGrid style={{width: '100%'}}>
            {date => <CalendarCell date={date} style={({isSelected, isOutsideMonth}) => ({display: isOutsideMonth ? 'none' : '', textAlign: 'center', cursor: 'default', background: isSelected ? 'blue' : ''})} />}
          </CalendarGrid>
        </Calendar>
      </Dialog>
    </Popover>
  </DatePicker>
);

export const DatePickerTriggerWidthExample: DatePickerStory = (args) => (
  <DatePicker data-testid="date-picker-example" {...args}>
    <Label style={{display: 'block'}}>Date</Label>
    <Group style={{display: 'inline-flex', width: 300}}>
      <DateInput className={styles.field} style={{flex: 1}}>
        {segment => <DateSegment segment={segment} className={clsx(styles.segment, {[styles.placeholder]: segment.isPlaceholder})} />}
      </DateInput>
      <Button>🗓</Button>
    </Group>
    <Popover
      placement="bottom start"
      style={{
        background: 'Canvas',
        color: 'CanvasText',
        border: '1px solid gray',
        padding: 20,
        boxSizing: 'border-box',
        width: 'var(--trigger-width)'
      }}>
      <Dialog>
        <Calendar>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <Button slot="previous">&lt;</Button>
            <Heading style={{flex: 1, textAlign: 'center'}} />
            <Button slot="next">&gt;</Button>
          </div>
          <CalendarGrid style={{width: '100%'}}>
            {date => <CalendarCell date={date} style={({isSelected, isOutsideMonth}) => ({display: isOutsideMonth ? 'none' : '', textAlign: 'center', cursor: 'default', background: isSelected ? 'blue' : ''})} />}
          </CalendarGrid>
        </Calendar>
      </Dialog>
    </Popover>
  </DatePicker>
);

export const DateRangePickerExample: DateRangePickerStory = (args) => (
  <DateRangePicker data-testid="date-range-picker-example" {...args}>
    <Label style={{display: 'block'}}>Date</Label>
    <Group style={{display: 'inline-flex'}}>
      <div className={styles.field}>
        <DateInput data-testid="date-range-picker-date-input" slot="start" style={{display: 'inline'}}>
          {segment => <DateSegment segment={segment} className={clsx(styles.segment, {[styles.placeholder]: segment.isPlaceholder})} />}
        </DateInput>
        <span aria-hidden="true" style={{padding: '0 4px'}}>–</span>
        <DateInput slot="end" style={{display: 'inline'}}>
          {segment => <DateSegment segment={segment} className={clsx(styles.segment, {[styles.placeholder]: segment.isPlaceholder})} />}
        </DateInput>
      </div>
      <Button>🗓</Button>
    </Group>
    <Popover
      placement="bottom start"
      style={{
        background: 'Canvas',
        color: 'CanvasText',
        border: '1px solid gray',
        padding: 20
      }}>
      <Dialog>
        <RangeCalendar style={{width: 220}}>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <Button slot="previous">&lt;</Button>
            <Heading style={{flex: 1, textAlign: 'center'}} />
            <Button slot="next">&gt;</Button>
          </div>
          <CalendarGrid style={{width: '100%'}}>
            {date => <CalendarCell date={date} style={({isSelected, isOutsideMonth}) => ({display: isOutsideMonth ? 'none' : '', textAlign: 'center', cursor: 'default', background: isSelected ? 'blue' : ''})} />}
          </CalendarGrid>
        </RangeCalendar>
      </Dialog>
    </Popover>
  </DateRangePicker>
);

export const DateRangePickerTriggerWidthExample: DateRangePickerStory = (args) => (
  <DateRangePicker data-testid="date-range-picker-example" {...args}>
    <Label style={{display: 'block'}}>Date</Label>
    <Group style={{display: 'inline-flex', width: 300}}>
      <div className={styles.field} style={{flex: 1}}>
        <DateInput data-testid="date-range-picker-date-input" slot="start" style={{display: 'inline'}}>
          {segment => <DateSegment segment={segment} className={clsx(styles.segment, {[styles.placeholder]: segment.isPlaceholder})} />}
        </DateInput>
        <span aria-hidden="true" style={{padding: '0 4px'}}>–</span>
        <DateInput slot="end" style={{display: 'inline'}}>
          {segment => <DateSegment segment={segment} className={clsx(styles.segment, {[styles.placeholder]: segment.isPlaceholder})} />}
        </DateInput>
      </div>
      <Button>🗓</Button>
    </Group>
    <Popover
      placement="bottom start"
      style={{
        background: 'Canvas',
        color: 'CanvasText',
        border: '1px solid gray',
        padding: 20,
        boxSizing: 'border-box',
        width: 'var(--trigger-width)'
      }}>
      <Dialog>
        <RangeCalendar>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <Button slot="previous">&lt;</Button>
            <Heading style={{flex: 1, textAlign: 'center'}} />
            <Button slot="next">&gt;</Button>
          </div>
          <CalendarGrid style={{width: '100%'}}>
            {date => <CalendarCell date={date} style={({isSelected, isOutsideMonth}) => ({display: isOutsideMonth ? 'none' : '', textAlign: 'center', cursor: 'default', background: isSelected ? 'blue' : ''})} />}
          </CalendarGrid>
        </RangeCalendar>
      </Dialog>
    </Popover>
  </DateRangePicker>
);

export const DatePickerAutofill = (props) => (
  <Form
    onSubmit={e => {
      action('onSubmit')(Object.fromEntries(new FormData(e.target as HTMLFormElement).entries()));
      e.preventDefault();
    }}>
    <TextField>
      <Label>Name</Label>
      <Input name="firstName" type="name" id="name" autoComplete="name" />
    </TextField>
    <DatePicker data-testid="date-picker-example" name="bday" autoComplete="bday" {...props}>
      <Label style={{display: 'block'}}>Date</Label>
      <Group style={{display: 'inline-flex'}}>
        <DateInput className={styles.field}>
          {segment => <DateSegment segment={segment} className={clsx(styles.segment, {[styles.placeholder]: segment.isPlaceholder})} />}
        </DateInput>
        <Button>🗓</Button>
      </Group>
      <Popover
        placement="bottom start"
        style={{
          background: 'Canvas',
          color: 'CanvasText',
          border: '1px solid gray',
          padding: 20
        }}>
        <Dialog>
          <Calendar style={{width: 220}}>
            <div style={{display: 'flex', alignItems: 'center'}}>
              <Button slot="previous">&lt;</Button>
              <Heading style={{flex: 1, textAlign: 'center'}} />
              <Button slot="next">&gt;</Button>
            </div>
            <CalendarGrid style={{width: '100%'}}>
              {date => <CalendarCell date={date} style={({isSelected, isOutsideMonth}) => ({display: isOutsideMonth ? 'none' : '', textAlign: 'center', cursor: 'default', background: isSelected ? 'blue' : ''})} />}
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </DatePicker>
    <Button type="submit">Submit</Button>
  </Form>
);

export const FormValidationExample: DatePickerStory = (args) => {
  const datePickerRef = React.useRef(null);
  const [selectedDate, setSelectedDate] = React.useState(null);
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate that the date is in the future
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (!selectedDate) {
      setErrorMessage('Please select a date');
      // Focus the DatePicker using ref - this now works with ref forwarding!
      if (datePickerRef.current) {
        datePickerRef.current.focus();
      }
      return;
    }
    
    const selectedJsDate = new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day);
    
    if (selectedJsDate <= today) {
      setErrorMessage('Please select a future date');
      // Focus the DatePicker using ref - this now works with ref forwarding!
      if (datePickerRef.current) {
        datePickerRef.current.focus();
      }
      return;
    }
    
    // Validation passed
    setErrorMessage('');
    action('Form submitted successfully!')(selectedDate);
  };

  return (
    <Form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: 12}}>
      <DatePicker
        ref={datePickerRef}
        value={selectedDate}
        onChange={setSelectedDate}
        {...args}>
        <Label style={{display: 'block'}}>Select Event Date (must be in the future)</Label>
        <Group style={{display: 'inline-flex'}}>
          <DateInput className={styles.field}>
            {segment => <DateSegment segment={segment} className={clsx(styles.segment, {[styles.placeholder]: segment.isPlaceholder})} />}
          </DateInput>
          <Button>🗓</Button>
        </Group>
        <Popover
          placement="bottom start"
          style={{
            background: 'Canvas',
            color: 'CanvasText',
            border: '1px solid gray',
            padding: 20
          }}>
          <Dialog>
            <Calendar style={{width: 220}}>
              <div style={{display: 'flex', alignItems: 'center'}}>
                <Button slot="previous">&lt;</Button>
                <Heading style={{flex: 1, textAlign: 'center'}} />
                <Button slot="next">&gt;</Button>
              </div>
              <CalendarGrid style={{width: '100%'}}>
                {date => <CalendarCell date={date} style={({isSelected, isOutsideMonth}) => ({display: isOutsideMonth ? 'none' : '', textAlign: 'center', cursor: 'default', background: isSelected ? 'blue' : ''})} />}
              </CalendarGrid>
            </Calendar>
          </Dialog>
        </Popover>
      </DatePicker>
      
      {errorMessage && (
        <div style={{color: 'red', fontSize: '14px', marginTop: 4}}>
          {errorMessage}
        </div>
      )}
      
      <Button type="submit" style={{marginTop: 8, alignSelf: 'flex-start'}}>
        Submit
      </Button>
    </Form>
  );
};

/**
 * DatePicker with react-hook-form
 * 
 * This story demonstrates DatePicker with ref forwarding support for react-hook-form integration.
 * The DatePicker now exposes a focus() method that automatically focuses the first date segment,
 * enabling validation error auto-focus functionality.
 * 
 * Test scenarios:
 * 1. Submit with no date - should auto-focus DatePicker
 * 2. Submit with past/today's date - should auto-focus DatePicker with error
 * 3. Submit with future date - should succeed without auto-focus
 */
export const DatePickerWithReactHookForm: DatePickerStory = (args) => {
  const datePickerRef = React.useRef(null);
  const [selectedDate, setSelectedDate] = React.useState(null);
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate that the date is in the future
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (!selectedDate) {
      setErrorMessage('Please select a date');
      // Simulates react-hook-form's setFocus() - auto-focus the DatePicker
      if (datePickerRef.current) {
        datePickerRef.current.focus();
      }
      return;
    }
    
    const selectedJsDate = new Date(selectedDate.year, selectedDate.month - 1, selectedDate.day);
    
    if (selectedJsDate <= today) {
      setErrorMessage('Please select a future date (not today or in the past)');
      // Simulates react-hook-form's setFocus() - auto-focus the DatePicker on validation error
      if (datePickerRef.current) {
        datePickerRef.current.focus();
      }
      return;
    }
    
    // Validation passed
    setErrorMessage('');
    action('Form submitted successfully!')(selectedDate);
    alert('Success! Form submitted with valid future date.');
  };

  return (
    <div style={{padding: 20}}>
      <h3>DatePicker with Auto-Focus on Validation Error</h3>
      <p style={{marginBottom: 20, color: '#666'}}>
        This demonstrates the ref forwarding fix for issue #7756. 
        Try submitting with no date, a past date, or a future date to test auto-focus behavior.
      </p>
      
      <Form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400}}>
        <DatePicker
          ref={datePickerRef}
          value={selectedDate}
          onChange={setSelectedDate}
          {...args}>
          <Label style={{display: 'block', fontWeight: 'bold', marginBottom: 4}}>
            Event Date *
          </Label>
          <Group style={{display: 'inline-flex', border: errorMessage ? '2px solid red' : '1px solid #ccc', borderRadius: 4, padding: 4}}>
            <DateInput className={styles.field}>
              {segment => <DateSegment segment={segment} className={clsx(styles.segment, {[styles.placeholder]: segment.isPlaceholder})} />}
            </DateInput>
            <Button style={{marginLeft: 8}}>🗓</Button>
          </Group>
          <Popover
            placement="bottom start"
            style={{
              background: 'Canvas',
              color: 'CanvasText',
              border: '1px solid gray',
              padding: 20,
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
            <Dialog>
              <Calendar style={{width: 220}}>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: 8}}>
                  <Button slot="previous">&lt;</Button>
                  <Heading style={{flex: 1, textAlign: 'center'}} />
                  <Button slot="next">&gt;</Button>
                </div>
                <CalendarGrid style={{width: '100%'}}>
                  {date => <CalendarCell date={date} style={({isSelected, isOutsideMonth}) => ({display: isOutsideMonth ? 'none' : '', textAlign: 'center', cursor: 'default', background: isSelected ? 'blue' : '', color: isSelected ? 'white' : '', borderRadius: 4, padding: 4})} />}
                </CalendarGrid>
              </Calendar>
            </Dialog>
          </Popover>
        </DatePicker>
        
        {errorMessage && (
          <div style={{color: 'red', fontSize: '14px', padding: 8, backgroundColor: '#fee', borderRadius: 4, border: '1px solid red'}}>
            ⚠️ {errorMessage}
          </div>
        )}
        
        <div style={{fontSize: '12px', color: '#666', marginTop: -8}}>
          * Date must be in the future
        </div>
        
        <Button 
          type="submit" 
          style={{
            marginTop: 8, 
            alignSelf: 'flex-start',
            padding: '8px 16px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
          Submit
        </Button>
      </Form>
      
      <div style={{marginTop: 32, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 4}}>
        <h4 style={{marginTop: 0}}>Test Scenarios:</h4>
        <ol style={{fontSize: '14px', lineHeight: 1.6}}>
          <li><strong>No date:</strong> Submit without selecting a date - DatePicker will auto-focus</li>
          <li><strong>Past/Today:</strong> Select today or a past date - DatePicker will auto-focus with error</li>
          <li><strong>Future date:</strong> Select a future date - Form submits successfully</li>
        </ol>
      </div>
    </div>
  );
};
