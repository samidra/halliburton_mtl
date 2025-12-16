import { Component, ElementRef, HostListener, Inject, ViewChild } from '@angular/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import moment from 'moment';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog"
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Title } from '@angular/platform-browser';
import { CommonServiceService } from '../Services/common-service.service';
import { AllApiServiceService } from '../Services/all-api-service.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { LocalStorageService } from '../Services/local-storage.service';

interface Task {
  isHighlighted?: any;
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
  scheduleDate: string;
  tasks: Task[][];
}

@Component({
  selector: 'app-calendar-comp',
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
  templateUrl: './calendar-comp.component.html',
  styleUrl: './calendar-comp.component.scss'
})

export class CalendarCompComponent {

  currentDate = moment(); // Current date
  selectedDates: Set<string> = new Set();
  isDateSelected(date: any): boolean {
    const formatted = date.format('YYYY-MM-DD');
    return this.selectedDates.has(formatted);
  }
  daysInMonth: any[] = []; // Days for the current month
  weekdays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  duration: any;
  work_request_id: any;
  task_id: any;
  todo: { [key: string]: Task[] } = {};
  locationOptions: string[] = [];
  selected_location = '';
  resourcesOptions: string[] = [];
  selected_resource = ''
  private routerSubscription: Subscription | undefined;
  isLoading: boolean = true;
  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef
  @ViewChild('inputField') inputField!: ElementRef
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

  ngOnInit(): void {
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
    });
    this.month_date = this.currentDate.format('MMMM YYYY');
    this.get_schedule_data(this.month_date);
  }

  isToday(date: any): boolean {
    const today = new Date();
    return date.date() === today.getDate() &&
      date.month() === today.getMonth() &&
      date.year() === today.getFullYear();
  }

  sceduled_data !: ScheduleEntry[]
  api_data: any
  month_date: any
  // get_schedule_data(month_date: any) {
  //   this.todo = {};
  //   this.api_service.get_schedule_data_calendar(month_date).subscribe({
  //     next: (value: any) => {
  //       this.api_data = value
  //       this.sceduled_data = this.api_data.dateWiseSchedule
  //       this.locationOptions = this.api_data.locationWiseResources.map((item: { loc: any }) => item.loc)
  //       this.isLoading = false

  //       
  //       const todo: { [key: string]: Task[] } = {};

  //       this.sceduled_data.forEach((entry: ScheduleEntry) => {
  //         const date = entry.scheduleDate.split('T')[0];

  //         entry.tasks.forEach((taskGroup: Task[]) => {
  //           taskGroup.forEach((task: Task) => {
  //             if (!todo[date]) {
  //               todo[date] = [];
  //             }

  //             todo[date].push({
  //               ...task
  //             });
  //           });
  //         });
  //       });

  //       this.todo = todo;
  //       this.generateCalendar();
  //     },
  //     error: (err) => {
  //       this.generateCalendar();
  //       this.isLoading = false
  //       console.error('API error:', err);
  //       // this.todo = []
  //     }
  //   });
  // }

  get_schedule_data(month_date: any) {
  this.todo = {};
   this.isLoading = true;
    this.api_service.get_schedule_data_calendar(month_date).subscribe({
    next: (value: any) => {
      this.api_data = value;
      this.isLoading = false;

      // Original data
      let data = this.api_data.dateWiseSchedule;

      // Filter by selected resource if it's not null, undefined, or empty string
      if (this.selected_resource !== undefined && this.selected_resource !== null && this.selected_resource !== '') {
        data = data.map((entry: ScheduleEntry) => ({
          ...entry,
          tasks: entry.tasks.map((taskGroup: Task[]) =>
            taskGroup.filter((task: Task) => task.resource === this.selected_resource)
          ).filter((taskGroup: Task[]) => taskGroup.length > 0) // Remove empty taskGroups
        })).filter((entry: ScheduleEntry) => entry.tasks.length > 0); // Remove entries with no tasks
      }

      this.sceduled_data = data;

      // Location dropdown options
      this.locationOptions = this.api_data.locationWiseResources.map(
        (item: { loc: any }) => item.loc
      );

      // Build todo map
      const todo: { [key: string]: Task[] } = {};
      this.sceduled_data.forEach((entry: ScheduleEntry) => {
        const date = entry.scheduleDate.split('T')[0];

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
      this.generateCalendar();
    },
    error: (err) => {
      this.generateCalendar();
      this.isLoading = false;
      console.error('API error:', err);
    }
  });
}

  generateCalendar(): void {
    const startOfMonth = this.currentDate.clone().startOf('month');
    const endOfMonth = this.currentDate.clone().endOf('month');
    const startDate = startOfMonth.clone().startOf('week');
    const endDate = endOfMonth.clone().endOf('week');

    const date = startDate.clone();
    this.daysInMonth = [];

    // const chargeCodeMap: { [chargeCode: string]: string[] } = {};
    const taskNumberMap: { [taskNumber: string]: string[] } = {};
    let allowedDays: string[] = [];
    if (this.selected_resource) {
      const selectedResourceInfo = this.api_data?.resourceWiseAvailableDay?.find(
        (res: { resource: any }) => res.resource === this.selected_resource
      );

      allowedDays = selectedResourceInfo?.daysRunning
        ?.split(',')
        .map((day: string) => day.trim()) ?? [];
    }

    while (date.isBefore(endDate, 'day')) {
      const formattedDate = date.format('YYYY-MM-DD');
      const tasks = this.todo[formattedDate] || [];
      const dayName = date.format('dddd');
      const isDisabled = this.selected_resource ? !allowedDays.includes(dayName) : false;

      tasks.forEach(task => {
        if (task.taskNumber) {
          if (!taskNumberMap[task.taskNumber]) {
            taskNumberMap[task.taskNumber] = [];
          }
          taskNumberMap[task.taskNumber].push(formattedDate);
        }
      });

      this.daysInMonth.push({
        date: date.clone(),
        isCurrentMonth: date.month() === this.currentDate.month(),
        todo: tasks,
        dayOfWeek: date.day(),
        isDisabled: isDisabled
      });

      date.add(1, 'day');
    }

    this.highlightValidSequences(taskNumberMap);
  }

  highlightValidSequences(taskNumberMap: { [taskNumber: string]: string[] }): void {
  Object.entries(taskNumberMap).forEach(([taskNumber, dates]) => {
    dates.sort(); // Ensure dates are in order

    let sequence: string[] = [];

    for (let i = 0; i < dates.length; i++) {
      const current = moment(dates[i]);
      const prev = i > 0 ? moment(dates[i - 1]) : null;

      if (prev && current.diff(prev, 'days') === 1) {
        sequence.push(dates[i - 1]);
        sequence.push(dates[i]);
      } else {
        this.markHighlighted(sequence, taskNumber); // use taskNumber
        sequence = [dates[i]];
      }
    }
    this.markHighlighted(sequence, taskNumber);
  });
}
  markHighlighted(sequence: string[], taskNumber: string): void {
  if (sequence.length > 1) {
    sequence.pop(); // Optional depending on whether you want to exclude last day

    this.daysInMonth.forEach(day => {
      if (sequence.includes(day.date.format('YYYY-MM-DD'))) {
        day.todo.forEach((task: { taskNumber: string; isHighlighted: boolean; }) => {
          if (task.taskNumber === taskNumber) {
            task.isHighlighted = true;
          }
        });
      }
    });
  }
}
  // toggleDateSelection(day: any): void {
  //   if (this.duration) {

  //     const selectedDate = day.date.startOf('day');
  //     const today = this.currentDate.clone().startOf('day');
  //     if (!selectedDate.isAfter(today)) {
  //       this.commonservice.displayWarning('Please select a date after the current date to schedule the test.');
  //       return;
  //     }

  //     const formattedDate = day.date.format('YYYY-MM-DD');
  //     if (this.selectedDates.has(formattedDate)) {
  //       this.selectedDates.delete(formattedDate);
  //       return;
  //     }

  //     if (this.selectedDates.size >= this.duration) {
  //       this.commonservice.displayWarning('Maximum number of dates selected.');
  //       return;
  //     }

  //     this.selectedDates.add(formattedDate);
  //     const sortedArray = Array.from(this.selectedDates).sort((a, b) => {
  //       return new Date(a).getTime() - new Date(b).getTime();
  //     });
  //     this.selectedDates = new Set(sortedArray);

  //     const remaining = this.duration - this.selectedDates.size;
  //     if (remaining > 0) {
  //       this.commonservice.displayWarning(`Please select ${remaining} more date${remaining > 1 ? 's' : ''}.`);
  //     } else {

  //       const dialogRef = this.dialog.open(add_to_schedule, {
  //         data: { selected_dates: sortedArray, work_request_id: this.work_request_id },
  //         width: '400px',
  //         panelClass: 'custom-dialog-container'
  //       })

  //       dialogRef.afterClosed().subscribe(result => {
  //         if (result === 'yes') {
  //           const body = {
  //             wRnumber: this.work_request_id,
  //             taskNumber: "TK0001",
  //             scheduleDate: [...this.selectedDates],
  //             monthYear: this.currentDate.format('MMMM YYYY'),
  //             location: "Singapore",
  //             resource: "Singapore - Thermal Oven 10",
  //             userID: "H317697"
  //           }
  //           
  //           this.api_service.add_to_schedule_request(body).subscribe({
  //             next: (res) => {
  //               
  //           window.history.replaceState({}, '', window.location.href);
  //             }, error: (err) => {
  //               
  //               this.commonservice.displayWarning('Some error occur, Please try again')
  //             }
  //           })
  //           this.commonservice.displaySuccess('Dates submitted successfully.');

  //         }
  //       })
  //     }
  //   }
  // }

  showlistlocationOptions: boolean = false;
  showlistresourcesOptions: boolean = false;
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
    this.generateCalendar();
    if (field === 'location') {
      const loc = value.trim().toLowerCase();
      const index = this.api_data.locationWiseResources.findIndex((item: any) =>
        item.loc.trim().toLowerCase() === loc
      );
      this.setResourcesByLocation(index);
    }else{
      this.get_schedule_data(this.month_date)
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

  // select_dates_to_schedule(day: any): void {
  //   if (this.duration) {

  //     const selectedDate = day.date.startOf('day');
  //     const today = this.currentDate.clone().startOf('day');
  //     if (!selectedDate.isAfter(today)) {
  //       this.commonservice.displayWarning('Please select a date after the current date to schedule the test.');
  //       return;
  //     }

  //     this.selectedDates.clear();
  //     for (let i = 0; i <= this.duration; i++) {
  //       const nextDate = day.date.clone().add(i, 'days');
  //       const formattedDate = nextDate.format('YYYY-MM-DD');
  //       this.selectedDates.add(formattedDate)
  //     }

  //     const sortedArray = Array.from(this.selectedDates).sort((a, b) => {
  //       return new Date(a).getTime() - new Date(b).getTime();
  //     });
  //     this.selectedDates = new Set(sortedArray);

  //   }
  // }

  select_dates_to_schedule(day: any): void {
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

  isSelected(day: any): boolean {
    return this.selectedDates.has(day.date.format('YYYY-MM-DD'));
  }

  prevMonth(): void {
    this.isLoading = true
    this.currentDate = this.currentDate.subtract(1, 'month');
    this.month_date = this.currentDate.format('MMMM YYYY')
    this.get_schedule_data(this.month_date)
    this.generateCalendar();
  }

  nextMonth(): void {
    this.isLoading = true
    this.currentDate = this.currentDate.add(1, 'month');
    this.month_date = this.currentDate.format('MMMM YYYY')
    this.get_schedule_data(this.month_date)
    this.generateCalendar();
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

  drop(event: CdkDragDrop<any>, day: any): void {
    
    if (day.dayOfWeek === 0 || day.dayOfWeek === 6) {
      this.commonservice.displayWarning('The selected resource is unavailable on this day. Please choose a different date.')
      return;
    }
    const originalDate = event.item.data.date.clone();
    const previousDate = originalDate.format('YYYY-MM-DD');
    const previousToDoDate = originalDate.clone().subtract(1, 'day').format('YYYY-MM-DD');

    const newDate = event.container.data.date.format('YYYY-MM-DD');
    const draggedTask_details = event.item.data.task;
    const draggedTask_status = event.item.data.task.status;
    const draggedTask_ChargeCode = event.item.data.task.chargeCode;
    
    if (previousDate === newDate) {
      this.commonservice.displayWarning('Request dropped on the same date. No changes made.');
      return;
    }

    if (!this.todo[newDate]) {
      this.todo[newDate] = [];
    }

    const isDuplicate = this.todo[newDate].some(task =>
      task.chargeCode === draggedTask_ChargeCode && task.status === draggedTask_status
    );

    if (isDuplicate) {
      this.commonservice.displayWarning('Request with the same charge code already exists on this date.');
      return;
    }

    this.todo[newDate].push({
      ...draggedTask_details
    });

    if (this.todo[previousToDoDate]) {
      this.todo[previousToDoDate] = this.todo[previousToDoDate].map(task => {
        if (task.chargeCode === draggedTask_ChargeCode) {
          return { ...task, isHighlighted: false };
        }
        return task;
      });
    }

    if (this.todo[previousDate]) {
      this.todo[previousDate] = this.todo[previousDate].filter(task => task.status !== draggedTask_status);
    }

    this.commonservice.displaySuccess('Request updated to new date successfully.');
    
    this.generateCalendar();
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

  rightClick(event: MouseEvent) {
    event.preventDefault()
    alert("Hello")
  }
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
                  <th>Comment:</th>
                  <td>{{task_data?.comments}}</td>
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

                <tr>
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
  styleUrl: './calendar-comp.component.scss'
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

  view_taskRequest_all_detail(work_request_no: any,task_request_no:any) {
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
  styleUrl: './calendar-comp.component.scss'
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
  styleUrl: './calendar-comp.component.scss'
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
  approve_task(approval_type:any) {

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