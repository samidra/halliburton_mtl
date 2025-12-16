import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import dayjs from './dayjs-setup';
import moment from 'moment';

import { CommonServiceService } from '../Services/common-service.service';
import { AllApiServiceService } from '../Services/all-api-service.service';
import { LocalStorageService } from '../Services/local-storage.service';
interface CalendarDay {
  date: any;
  isCurrentMonth: boolean;
  isDisabled: boolean;
}

interface Task {
  taskNumber?: string;
  userID?: string;
  wRnumber?: string;
  chargeCode: string;
  description?: string;
  endDate?: string;
  location?: string;
  resource?: string;
  scheduleDate?: string;
  startDate?: string;
  status: string;
}

interface ScheduleEntry {
  startDate: string;
  tasks: Task[][];
}

@Component({
  selector: 'app-calender-new',
  imports: [
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    CommonModule,
    DragDropModule,
    MatIconModule,
    MatCardModule,
    FormsModule,
    CommonModule
  ],
  templateUrl: './calender-new.component.html',
  styleUrl: './calender-new.component.scss'
})
export class CalenderNewComponent {
  daysInMonth: any[] = [];
  locationOptions: string[] = [];
  selected_location = '';
  resourcesOptions: string[] = [];
  selected_resource = ''
  currentDate = moment();
  weekDays = moment.weekdaysShort();
  isLoading: boolean = true;
  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef;
  @ViewChild('inputField') inputField!: ElementRef;
  sceduled_data !: ScheduleEntry[]
  todo: { [key: string]: Task[] } = {};
  showlistlocationOptions: boolean = false;
  showlistresourcesOptions: boolean = false;
  currentMonth_date!: string;
  work_request_id: any;
  task_id: any;
  duration: any = "5";
  @HostListener('document:click', ['$event'])

  handleClickOutside(event: Event): void {

    if (!this.inputField || !this.dropdownContainer) {
      return;
    }

    const clickedInsideInput = this.inputField.nativeElement.contains(event.target)
    const clickedInsideDropdown = this.inputField.nativeElement.contains(event.target)
    if (!clickedInsideInput && !clickedInsideDropdown) {
      this.showlistlocationOptions = false
      this.showlistresourcesOptions = false
    }

  }

  constructor(public dialog: MatDialog,
    private titleService: Title,
    private router: Router,
    private local_storage: LocalStorageService,
    private route: ActivatedRoute,
    private api_service: AllApiServiceService,
    private commonservice: CommonServiceService) { }

  ngOnInit() {
    this.titleService.setTitle('Calendar | MTL HALLIBURTON');
    this.route.params.subscribe(params => {
      const wRnumber = params['wRnumber'];
      const taskNumber = params['taskNumber'];

      if (wRnumber && taskNumber) {
        const data = this.local_storage.getDataFormCalender();  // Read from real localStorage
        console
        if (data) {
          this.work_request_id = data?.wRnumber;
          this.duration = data?.duration;
          this.task_id = data?.taskNumber;
          this.selected_location = data?.location;
          this.selected_resource = data?.resource;

          if (this.work_request_id && this.task_id) {
            this.commonservice.displaySuccess(
              `Kindly choose ${data.duration} test dates for Task Id ${this.task_id} of Work Request ${data.wRnumber}.`
            );
          }
        }
      }
      this.currentMonth_date = this.currentDate.format('MMMM YYYY');
      this.get_schedule_data(this.currentMonth_date)
    });
  }

  api_data: any
  get_schedule_data(month_date: any) {
    this.todo = {};
    this.isLoading = true;
    this.api_service.get_schedule_data_calendar(month_date).subscribe({
      next: (value: any) => {
        console.log(value)
        this.generateDaysInMonth();
        this.api_data = value;
        this.isLoading = false;
        let data = this.api_data.dateWiseSchedule;
        if (this.selected_resource !== undefined && this.selected_resource !== null && this.selected_resource !== '') {
          data = data.map((entry: ScheduleEntry) => ({
            ...entry,
            tasks: entry.tasks.map((taskGroup: Task[]) =>
              taskGroup.filter((task: Task) => task.resource === this.selected_resource)
            ).filter((taskGroup: Task[]) => taskGroup.length > 0)
          })).filter((entry: ScheduleEntry) => entry.tasks.length > 0);
        }

        this.sceduled_data = data;
        this.locationOptions = this.api_data.locationWiseResources.map(
          (item: { loc: any }) => item.loc
        );

        const todo: { [key: string]: Task[] } = {};
        this.sceduled_data.forEach((entry: ScheduleEntry) => {
          const date = entry.startDate.split('T')[0];
          entry.tasks.forEach((taskGroup: Task[]) => {
            taskGroup.forEach((task: Task) => {
              if (!todo[date]) {
                todo[date] = [];
              }
              todo[date].push({ ...task });
            });
          });
        });

        this.todo = todo;
        console.log(this.todo)
        this.generateDaysInMonth();
      },
      error: (err) => {
        this.generateDaysInMonth();
        this.isLoading = false;
        console.error('API error:', err);
      }
    });
  }

  generateDaysInMonth() {
    const today = dayjs(this.currentDate.format('YYYY-MM-01'));
    const start = today.startOf('month').startOf('week');
    const end = today.endOf('month').endOf('week');
    const days = [];
    let allowedDays: string[] = [];
    if (this.selected_resource) {
      const selectedResourceInfo = this.api_data?.resourceWiseAvailableDay?.find(
        (res: { resource: any }) => res.resource === this.selected_resource
      );

      allowedDays = selectedResourceInfo?.daysRunning
        ?.split(',')
        .map((day: string) => day.trim()) ?? [];
    }

    let currentDay = start;
    while (currentDay.isSameOrBefore(end)) {
      const dayName = currentDay.format('dddd');
      const isDisabled = this.selected_resource ? !allowedDays.includes(dayName) : false;
      days.push({
        date: currentDay,
        isCurrentMonth: currentDay.month() === today.month(),
        isDisabled: isDisabled,
        todo: [],
      });
      currentDay = currentDay.add(1, 'day');
    }
    this.daysInMonth = days;
  }

  getWeeks(): any[][] {
    const weeks = [];
    for (let i = 0; i < this.daysInMonth.length; i += 7) {
      weeks.push(this.daysInMonth.slice(i, i + 7));
    }
    return weeks;
  }

  getAllTodos() {
    const rawTodos = Object.values(this.todo).flat();
    return rawTodos.map((todo: any) => ({
      ...todo,
      startDate: new Date(todo.startDate ?? todo.scheduleDate),
      endDate: new Date(todo.endDate ?? todo.scheduleDate)
    }));
  }

  getEventsForWeek(week: any[]) {
    const todos = this.getAllTodos();

    return todos
      .filter(todo =>
        todo.startDate <= week[week.length - 1].date &&
        todo.endDate >= week[0].date
      )
      .sort((a, b) => {
        const durationA = new Date(a.endDate).getTime() - new Date(a.startDate).getTime();
        const durationB = new Date(b.endDate).getTime() - new Date(b.startDate).getTime();
        return durationB - durationA
      });
  }


  getGridColumnStart(todo: any, week: any[]) {
    const runningDays = todo.daysRunning.split(','); // e.g. ["Monday", "Tuesday", ...]

    for (let i = 0; i < week.length; i++) {
      const day = week[i];
      const dayDate = day.date.toDate ? day.date.toDate() : new Date(day.date);
      const dayName = day.date.format('dddd'); // "Monday", "Tuesday", ...

      // ✅ Skip disabled or non-running days
      if (
        !day.isDisabled &&
        runningDays.includes(dayName) &&
        dayDate >= todo.startDate &&
        dayDate <= todo.endDate
      ) {
        return i + 1; // CSS grid column start (1-based index)
      }
    }
    return 1;
  }

  getGridColumnEnd(todo: any, week: any[]) {
    const runningDays = todo.daysRunning.split(',');

    for (let i = week.length - 1; i >= 0; i--) {
      const day = week[i];
      const dayDate = day.date.toDate ? day.date.toDate() : new Date(day.date);
      const dayName = day.date.format('dddd');
      if (
        !day.isDisabled &&
        runningDays.includes(dayName) &&
        dayDate >= todo.startDate &&
        dayDate <= todo.endDate
      ) {
        return i + 2;
      }
    }
    return week.length + 1;
  }

  getMaxTodosForWeek(week: any[]): number {
    const todos = this.getEventsForWeek(week); // already split into segments

    return Math.max(
      0,
      ...week.map(day => {
        const dayDate = day.date.toDate ? day.date.toDate() : new Date(day.date);
        const isWeekend = ['Saturday', 'Sunday'].includes(day.date.format('dddd'));

        if (day.isDisabled || isWeekend) {
          return 0; // skip disabled and weekend days
        }

        return todos.filter(
          todo => todo.startDate <= dayDate && todo.endDate >= dayDate
        ).length;
      })
    );
  }

  getTaskColor(status: string): string {
    switch (status) {
      case 'Requested': return '#0041dc';
      case 'Approved': return '#43b400';
      case 'In Progress': return 'rgb(191 151 6)';
      case 'Completed': return 'black';
      case 'Facility shutdown': return '#d90000';
      case 'Draft': return 'rgb(191 178 0)';
      case 'Tentative': return 'rgb(191 178 0)';
      case 'Pending': return 'rgb(191 178 0)';
      default: return 'transparent';
    }
  }

  isToday(date: dayjs.Dayjs): boolean {
    return date.isSame(dayjs(), 'day');
  }

  show(value: string): void {

    this.showlistlocationOptions = false;
    this.showlistresourcesOptions = false;
    const showKey = `showlist${value}` as keyof this;
    (this as any)[showKey] = true;
    const field = value as keyof this
    if (field === 'locationOptions') {
      this.selected_resource = '';
      (this as any)[field] = [...new Set(this.api_data.locationWiseResources?.map((item: { loc: any }) => item.loc))];
    }
    // if (this.selected_location) {
    //   const loc = this.selected_location.trim().toLowerCase();
    //   const index = this.api_data.locationWiseResources.findIndex((item: any) =>
    //     item.loc.trim().toLowerCase() === loc
    //   );
    //   this.setResourcesByLocation(index);
    // } else {
    //   this.resourcesOptions = []
    // }
  }

  filteredAutocomplete(field: 'locationOptions' | 'resourcesOptions', filterKey: keyof this): void {
    const searchTerm = (String(this[filterKey]) || '').trim().toLowerCase();

    if (field === 'locationOptions') {

      const locations: any[] = [
        ...new Set(this.api_data.locationWiseResources.map((item: any) => item.loc)),
      ];

      this.locationOptions = searchTerm
        ? locations.filter(loc => loc.toLowerCase().includes(searchTerm))
        : locations;

    } else if (field === 'resourcesOptions') {
      const selectedLoc = this.selected_location?.trim().toLowerCase();
      const locationData = this.api_data.locationWiseResources.find(
        (item: any) => item.loc.trim().toLowerCase() === selectedLoc
      );

      const resources: string[] = locationData?.res || [];

      this.resourcesOptions = searchTerm
        ? resources.filter(res => res.toLowerCase().includes(searchTerm))
        : resources;
    }
  }

  filterData(field: any, value: any): void {
    const key = `selected_${field}` as 'selected_location' | 'selected_resource';
    this[key] = value;
    this.generateDaysInMonth();
    if (field === 'location') {
      const loc = value.trim().toLowerCase();
      const index = this.api_data.locationWiseResources.findIndex((item: any) =>
        item.loc.trim().toLowerCase() === loc
      );
      this.setResourcesByLocation(index);
    } else {
      this.get_schedule_data(this.currentMonth_date)
    }
  }

  setResourcesByLocation(index: number): void {
    if (index === -1) {
      this.resourcesOptions = [];
      return;
    }

    const resourceList = this.api_data.locationWiseResources[index].res;

    if (this.selected_resource) {
      const searchTerm = this.selected_resource.trim().toLowerCase();
      this.resourcesOptions = resourceList.filter((item: string) =>
        item.toLowerCase().includes(searchTerm)
      );
    } else {
      this.resourcesOptions = resourceList;
    }
  }

  prevMonth() {
    this.currentDate = this.currentDate.clone().subtract(1, 'month');
    this.get_schedule_data(this.currentDate.format('MMMM YYYY'))
  }

  nextMonth() {
    this.currentDate = this.currentDate.clone().add(1, 'month');
    this.get_schedule_data(this.currentDate.format('MMMM YYYY'))
  }

  drop(event: CdkDragDrop<any>, targetDay: any) {
    const todo = event.item.data; // dragged todo object
    if (!todo) return;

    const oldStart = todo.startDate;
    const oldEnd = todo.endDate;

    // Assign new date (example: both start and end equal target day)
    todo.startDate = targetDay.date;
    todo.endDate = targetDay.date;

    console.log('📌 Todo moved');
    console.log('Task:', todo.taskNumber);
    console.log('Old Start:', oldStart, 'Old End:', oldEnd);
    console.log('New Start:', todo.startDate, 'New End:', todo.endDate);
  }

  selectedDates: Set<string> = new Set();
  select_dates_to_schedule(day: any): void {

    const clickedDate = day.date.startOf('day').format('YYYY-MM-DD');

  // ✅ If clicked date already exists in selectedDates → clear all
  if (this.selectedDates.has(clickedDate)) {
    this.selectedDates.clear();
    return;
  }
  
    if (this.duration) {
      const selectedDate = day.date.startOf('day');
      const today = this.currentDate.clone().startOf('day');

      if (!selectedDate.isAfter(today)) {
        this.commonservice.displayWarning('Please select a date after the current date to schedule the test.');
        return;
      }

      // Get allowed days if resource is selected
      let allowedDays: string[] = [];
      if (this.selected_resource) {
        const selectedResourceInfo = this.api_data.resourceWiseAvailableDay.find(
          (res: { resource: any }) => res.resource === this.selected_resource
        );

        allowedDays = selectedResourceInfo?.daysRunning
          ?.split(',')
          .map((day: string) => day.trim()) ?? [];
      }

      this.selectedDates.clear();

      let i = 0;
      let daysAdded = 1;
      while (daysAdded <= this.duration) {
        const nextDate = selectedDate.clone().add(i, 'days');
        const dayName = nextDate.format('dddd');

        // If no selected_resource, or if day is allowed, add it
        if (!this.selected_resource || allowedDays.includes(dayName)) {
          const formattedDate = nextDate.format('YYYY-MM-DD');
          this.selectedDates.add(formattedDate);
          daysAdded++;
        }

        i++; // Move to next day
      }

      // Sort selectedDates
      const sortedArray = Array.from(this.selectedDates).sort((a, b) => {
        return new Date(a).getTime() - new Date(b).getTime();
      });
      this.selectedDates = new Set(sortedArray);
    }
  }

  isDateSelected(date: any): boolean {
    const formatted = date.format('YYYY-MM-DD');
    return this.selectedDates.has(formatted);
  }

  request_data_scheduled: any;
  task_request_see_detail(wRnumber: any, task_id: any): void {
    this.isLoading = true;


    this.api_service.get_workrequest_details(wRnumber).subscribe({
      next: (res) => {
        this.isLoading = false;

        if (!Array.isArray(res) || res.length === 0) {
          console.warn("No details found for the work request.");
          return;
        }

        const requestData = res[0];


        const detailDialogRef = this.dialog.open(calendar_schedule_date_detail, {
          width: '700px',
          data: { data: requestData, task_id }
        });

        detailDialogRef.afterClosed().subscribe(detailResult => {
          if (detailResult?.message !== 'Yes') return;
          this.isLoading = true;
          this.request_data_scheduled = detailResult.task;
          setTimeout(() => {
            this.schedule_api(wRnumber, task_id);
          }, 1000); // 5000 milliseconds = 5 seconds
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error("API Error:", err.message);
        this.commonservice.displayWarning('Some error occurred. Please try again.');
      }
    });
  }

  schedule_api(wRnumber: any, task_id: any) {
    this.isLoading = false;
    const scheduleDialogRef = this.dialog.open(add_to_schedule, {
      data: {
        selected_dates: this.selectedDates,
        work_request_id: wRnumber
      },
      width: '400px',
      panelClass: 'custom-dialog-container'
    });

    scheduleDialogRef.afterClosed().subscribe(scheduleResult => {
      if (scheduleResult !== 'Yes') return;
      this.isLoading = true;
      const body = {
        wRnumber: wRnumber,
        taskNumber: task_id,
        scheduleDate: [...this.selectedDates],
        monthYear: this.currentDate.format('MMMM YYYY'),
        location: this.request_data_scheduled.location,
        resource: this.request_data_scheduled.resource,
        userID: "H317697"
      };

      this.api_service.add_to_schedule_request(body).subscribe({

        next: (res) => {
          this.isLoading = false;

          this.commonservice.displaySuccess('Dates submitted successfully.');
          const data = {
            location: this.selected_location,
            resource: this.selected_resource,
          };
          if (data) {
            this.local_storage.setDataFormCalender(data);
            setTimeout(() => {
              window.location.reload();
            }, 50);
          }
        }, error: (err) => {

          this.isLoading = false;
          this.commonservice.displayWarning('Some error occur, Please try again')
        }
      })
    });
  }
  weeks: CalendarDay[][] = [];
}


// Show Data 
@Component({
  selector: 'calendar_schedule_date_detail',
  imports: [
    CommonModule
  ],
  template: `
    <div class="container-fluid calendar_schedule_date_detail">
      <div class="row">
        <div class="col-12">
          <h2>Detail of request on selected Date <i class="bi bi-x-circle" (click)="close()" style="cursor: pointer;"></i></h2>

          <div class="data_of_request">
            <table class="table table-bordered table-fixed">
              <thead>
                <tr>
                  <th>Work Request ID:</th>
                  <td><a (click)="view_workRequest_all_detail(request_data?.workId)">{{request_data?.workId}}</a></td>
                </tr>

                 <tr>
                  <th>Charge Code:</th>
                  <td>{{request_data?.networkNumber}}</td>
                </tr>

                <tr>
                  <th>Description:</th>
                  <td>{{request_data?.description}}</td>
                </tr>

                <tr>
                  <th>Tools:</th>
                  <td>{{request_data?.toolDescr}}</td>
                </tr>

                <tr>
                  <th>Task ID:</th>
                  <td><a (click)="view_taskRequest_all_detail(request_data?.workId, task_data?.taskId)">{{task_data?.taskId}}</a></td>
                </tr>

                <tr>
                  <th>Location:</th>
                  <td>{{task_data?.location}}</td>
                </tr>
    
                <tr>
                  <th>Resource:</th>
                  <td>{{task_data?.resource}}</td>
                </tr>
    
                <tr>
                  <th>Duration:</th>
                  <td>{{task_data?.daysRequested}}</td>
                </tr>

                <tr>
                  <th>Status:</th>
                  <td [ngStyle]="{
                    'color': 
                    task_data?.test_Status === 'Approved' ? 'green' : 
                    task_data?.test_Status === 'Submitted' ? 'green' : 
                    task_data?.test_Status === 'Draft' ? '#c79c04' : 
                    task_data?.test_Status === 'Tentatively Approved' ? '#c79c04' : 
                    task_data?.test_Status === 'Cancelled' ? 'red' : 
                    task_data?.test_Status === 'Reject' ? 'red' : 
                    task_data?.test_Status === 'Approval Pending' ? '#fc7303' : ''
                    }">{{task_data?.test_Status}}</td>
                </tr>

                <tr *ngIf= "task_data?.test_Status === 'Submitted' || task_data?.test_Status === 'Approval Pending'">
                  <th>Action:</th>
                  <td >
                    <div class="btn_div">
                      <button class="yesbtn" (click)="add_to_schedule()" *ngIf="task_data?.test_Status === 'Submitted'">Add to schedule</button>
                      <button class="yesbtn" (click)="view_taskRequest_all_detail(request_data?.workId, task_data?.taskId)" *ngIf="task_data?.test_Status === 'Approval Pending'">Approve</button>
                    </div>    
                  </td>
                </tr>
          </thead>
            
        </table>

          </div>
        </div>
      </div>
    </div>
    `,
  styleUrl: './calender-new.component.scss'
})

export class calendar_schedule_date_detail {

  request_data: any;
  task_data: any;
  request_number: any
  isLoading: boolean = true
  constructor(public detailDialogRef: MatDialogRef<calendar_schedule_date_detail>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialog: MatDialog,) {
    this.request_data = data.data.workRequestLists[0]
    // this.task_data = data.data.taskLists[0]
    if (data.task_id) {
      const index = data.data.taskLists.findIndex((task: any) => task.taskId === data.task_id)
      this.task_data = data.data.taskLists[index]
    }
  }

  getTaskColor(task: string): string {
    switch (task) {
      case 'Requested': return '#0041dc';
      case 'Approved': return '#43b400';
      case 'Completed': return 'black';
      case 'Facility shutdown': return '#d90000';
      case 'Draft': return 'rgb(191 178 0)';
      case 'Tentative': return 'rgb(191 178 0)';
      case 'Pending': return 'rgb(191 178 0)';
      default: return 'transparent';
    }
  }

  close() {
    this.detailDialogRef.close()
  }

  view_workRequest_all_detail(work_request_no: any) {
    window.open(`work-request/detail/${work_request_no}`, '_blank')
  }

  view_taskRequest_all_detail(work_request_no: any, task_request_no: any) {
    window.open(`task-request/detail/${work_request_no}/${task_request_no}`, '_blank')
  }

  add_to_schedule(): void {
    const data = {
      task: this.task_data,
      message: 'Yes'
    }
    this.detailDialogRef.close(data)
  }
}

// add to schedule 

@Component({
  selector: 'add_to_schedule',
  imports: [
    CommonModule
  ],
  template: `
  <div class="container-fluid add_tool">
    <div class="row">
      <div class="col-12">
        <!-- <h2>This information must be read before proceeding.</h2> -->

        <form>
        <span class="span_proceed">
          <strong>Note:</strong>
          You have selected the following dates for Work Request ID <strong style="color:#910303;">{{work_request_id}}</strong>:
        </span>
          <ul >
            <li *ngFor="let request_date of selected_dates">{{request_date}}</li>
          </ul>
          <span class="span_proceed">
          To confirm, please click the <strong style="color:#910303;">Proceed</strong> button to schedule the test on the selected dates for this work request.
        </span>
        <div class="btn_div">
         <button class="yesbtn" type="button" (click)="submit_yes('Yes')">Proceed</button>
        </div>
        </form>
      </div>
    </div>
  </div>
  `,
  styleUrl: './calender-new.component.scss'
})

export class add_to_schedule {

  selected_dates: any
  work_request_id: any
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public scheduleDialogRef: MatDialogRef<add_to_schedule>) {
    this.selected_dates = [...data.selected_dates]
    this.work_request_id = data.work_request_id

  }

  submit_yes(data: any) {
    this.scheduleDialogRef.close('Yes');
  }

}

// Approve 

@Component({
  selector: 'cancel_change_to_draft',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="container-fluid common_dialog">
    <div class="row">
      <div class="col-12">
        <h2>Please Confirm Approval For Task Request <strong style="color:green;">{{taskId}}</strong> </h2>
        <form>
          <textarea  [ngModelOptions]="{standalone: true}" [(ngModel)]="reason" placeholder="Comment" rows="5" cols="40"></textarea>
        <div class="btn_div"> 
        <button class="btn btn-warning me-2" type="button" (click)="approve_task('Tentative')"  *ngIf="!Is_spinner">Tentative</button>
        <button class="btn btn-primary me-2" type="button" (click)="approve_task('Approved')"  *ngIf="!Is_spinner">Approve</button>
        <button class="yesbtn" type="button" (click)="approve_task('Reject')"  *ngIf="!Is_spinner">Reject</button>
        <button class="yesbtn" *ngIf="Is_spinner">
            <div class="spinner"></div>
        </button>
        <button type="button" (click)="close()">Close</button>
        </div>
        </form>
      </div>

    </div>
  </div>
  `,
  styleUrl: './calender-new.component.scss'
})

export class cancel_change_to_draft {

  task_action_type: any
  word_id: any
  taskId: any
  constructor(public dialogRef: MatDialogRef<cancel_change_to_draft>,
    private api_service: AllApiServiceService,
    private common_service: CommonServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.task_action_type = data.value;
    this.word_id = data.word_id;
    this.taskId = data.taskId;
  }

  reason: string = ''
  submit_response: any
  Is_spinner: boolean = false
  approve_task(approval_type: any) {

    if (this.reason != "") {
      this.Is_spinner = true
      const body = {
        UserID: 'H317697',
        workId: this.word_id,
        taskId: this.taskId,
        actionType: approval_type,
        Reason: this.reason
      }

      this.api_service.modify_test_request(body).subscribe({

        next: (res) => {

          this.submit_response = res
          if (this.submit_response.status) {
            this.Is_spinner = false
            this.common_service.displaySuccess('Submitted Sucessfully')
            this.dialogRef.close('submitted')
            this.reason != ""
          } else {
            this.Is_spinner = false
            this.common_service.displayWarning('Request failed. Please try again later')
          }
        },
        error: (err) => {
          this.Is_spinner = false;
          console.error('API error:', err);
          this.common_service.displayWarning('Request failed. Please try again later');
        },
      })
    } else {
      this.common_service.displayWarning('Please provide a Reason before submitting.');
    }
  }

  close() {
    this.dialogRef.close()
  }

}
