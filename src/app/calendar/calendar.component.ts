import { Component, signal, ChangeDetectorRef, HostListener, ViewChild, ElementRef, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DateSelectArg, EventClickArg, EventApi } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { AllApiServiceService } from '../Services/all-api-service.service';
import { CommonServiceService } from '../Services/common-service.service';
import { LocalStorageService } from '../Services/local-storage.service';
import moment from 'moment';
import { FormsModule } from '@angular/forms';
import dayjs from 'dayjs';

interface Task {
  dateScheduled: any
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
  selector: 'app-calendar',
  imports: [CommonModule, FullCalendarModule, FormsModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})

export class CalendarComponent {
  hiddenEvents: any[] = [];
  calendarVisible = signal(true);
  locationOptions: string[] = [];
  selected_location = '';
  resourcesOptions: string[] = [];
  selected_resource = '';
  sceduled_data !: ScheduleEntry[]
  todo: Task[] = [];
  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef;
  @ViewChild('inputField') inputField!: ElementRef;
  showlistlocationOptions: boolean = false;
  showlistresourcesOptions: boolean = false;
  currentDate = moment();
  currentMonth_date!: string;
  work_request_id: any;
  task_id: any;
  duration: any = '';
  currentEvents = signal<EventApi[]>([]);
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

  constructor(private changeDetector: ChangeDetectorRef,
    public dialog: MatDialog,
    private titleService: Title,
    private router: Router,
    private local_storage: LocalStorageService,
    private route: ActivatedRoute,
    private api_service: AllApiServiceService,
    private commonservice: CommonServiceService
  ) { }

  ngOnInit() {

    this.titleService.setTitle('Calendar | MTL HALLIBURTON');
    this.route.params.subscribe(params => {
      const wRnumber = params['wRnumber'];
      const taskNumber = params['taskNumber'];

      if (wRnumber && taskNumber) {
        const data = this.local_storage.getDataFormCalender();
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
      } else {
        const data = this.local_storage.getCalendarLocationCache();
        this.selected_location = data?.selected_location;
        this.selected_resource = data?.selected_resource;
      }
      this.currentMonth_date = this.currentDate.format('MMMM YYYY');
      this.get_schedule_data(this.currentMonth_date)
    });
  }

  api_data: any
  allowedDays: string[] = [];
  isLoading: boolean = true;
  get_schedule_data(month_date: any) {
    this.todo = [];
    this.isLoading = true;

    this.api_service.get_schedule_data_calendar(month_date).subscribe({
      next: (value: any) => {
        this.api_data = value;

        setTimeout(() => {
          this.isLoading = false;
        }, 1000);

        let data = this.api_data.dateWiseSchedule;

        if (this.selected_resource) {
          data = data
            .map((entry: ScheduleEntry) => ({
              ...entry,
              tasks: entry.tasks
                .map((taskGroup: Task[]) =>
                  taskGroup.filter(
                    (task: Task) => task.resource === this.selected_resource
                  )
                )
                .filter((taskGroup: Task[]) => taskGroup.length > 0)
            }))
            .filter((entry: ScheduleEntry) => entry.tasks.length > 0);
        }

        this.sceduled_data = data;
        this.locationOptions = this.api_data.locationWiseResources.map(
          (item: { loc: any }) => item.loc
        );

        const tasks: Task[] = [];
        this.sceduled_data.forEach((entry: ScheduleEntry) => {
          entry.tasks.forEach((taskGroup: Task[]) => {
            taskGroup.forEach((task: Task) => {
              tasks.push({ ...task });
            });
          });
        });

        this.todo = tasks;

        if (this.selected_resource) {
          const selectedResourceInfo =
            this.api_data?.resourceWiseAvailableDay?.find(
              (res: { resource: any }) =>
                res.resource === this.selected_resource
            );

          this.allowedDays =
            selectedResourceInfo?.daysRunning
              ?.split(',')
              .map((day: string) => day.trim()) ?? [];
        }

        function getConsecutiveRanges(dates: string[]) {
          if (!dates || !dates.length) return [];

          const sorted = dates
            .map(d => new Date(d))
            .sort((a, b) => a.getTime() - b.getTime());

          const ranges: { start: string; end: string }[] = [];
          let rangeStart = sorted[0];
          let prev = sorted[0];

          for (let i = 1; i < sorted.length; i++) {
            const diff = (sorted[i].getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

            if (diff === 1) {
              prev = sorted[i];
            } else {
              ranges.push({
                start: rangeStart.toISOString().split('T')[0],
                end: new Date(prev.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              });
              rangeStart = sorted[i];
              prev = sorted[i];
            }
          }

          ranges.push({
            start: rangeStart.toISOString().split('T')[0],
            end: new Date(prev.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });

          return ranges;
        }

        let mappedEvents: any[] = [];
        this.todo.forEach(task => {
          const ranges = getConsecutiveRanges(task.dateScheduled);

          ranges.forEach(range => {
            mappedEvents.push({
              id: `${task.taskNumber}-${range.start}`,
              title: `${task.wRnumber}-${task.taskNumber} - ${task.resource}`,
              wRnumber: task.wRnumber,
              taskNumber: task.taskNumber,
              start: range.start,
              end: range.end,
              daysRunning: task,
              allDay: true,
              backgroundColor: this.getTaskColor(task.status),
              borderColor: this.getTaskColor(task.status),
            });
          });
        });

        this.calendarOptions.update(options => ({
          ...options,
          events: mappedEvents
        }));
      },
      error: (err) => {
        this.isLoading = false;
        console.error('API error:', err);
      }
    });
  }

  calendarOptions = signal<CalendarOptions>({
    plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
    headerToolbar: {
      left: 'prev,next',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    timeZone: 'local',
    initialView: 'dayGridMonth',
    events: [],
    weekends: true,
    editable: true,
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    aspectRatio: 2.3,
    fixedWeekCount: false,

    select: (info) => this.handleDateSelect(info),
    eventClick: (info) => this.handleEventClick(info),
    eventsSet: this.handleEvents.bind(this),
    eventDragStart: (info) => this.handleEventDragStart(info),
    eventDrop: (info) => this.handleEventDrop(info),
    eventDragStop: (info) => this.handleEventDragStop(info),

    selectAllow: (selectInfo) => {
      const dayName = dayjs(selectInfo.start).format('dddd');
      if (this.selected_resource && this.allowedDays.length > 0) {
        return this.allowedDays.includes(dayName);
      }
      return true;
    },

    dayCellClassNames: (arg) => {
      const dayName = dayjs(arg.date).format('dddd');
      if (
        this.selected_resource &&
        this.allowedDays.length > 0 &&
        !this.allowedDays.includes(dayName)
      ) {
        return ['fc-day-disabled'];
      }
      return [];
    },

    // 👇 This is the key part
    datesSet: (info) => this.handleMonthChange(info)

  });

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


    if (field === 'resourcesOptions') {
      this.showlistresourcesOptions = true;
      const selectedLoc = this.selected_location?.trim().toLowerCase();
      const locationData = this.api_data.locationWiseResources.find(
        (item: any) => item.loc.trim().toLowerCase() === selectedLoc
      );

      const resources: string[] = locationData?.res || [];

      this.resourcesOptions = resources;
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

      const filteredLocation = searchTerm
        ? locations.filter(loc => loc.toLowerCase().includes(searchTerm))
        : locations;
      this.locationOptions = filteredLocation.length ? filteredLocation : ['No data with this search']

    } else if (field === 'resourcesOptions') {
      const selectedLoc = this.selected_location?.trim().toLowerCase();

      const locationData = this.api_data.locationWiseResources.find(
        (item: any) => item.loc.trim().toLowerCase() === selectedLoc
      );

      const resources: string[] = locationData?.res || [];
      const filtered = resources.filter(res =>
        res.toLowerCase().includes(searchTerm.trim().toLowerCase())
      );

      this.resourcesOptions = filtered.length
        ? filtered
        : ['No data with this search'];
    }

  }

  filterData(field: any, value: any): void {
    const key = `selected_${field}` as 'selected_location' | 'selected_resource';
    this[key] = value;
    if (field === 'location') {
      const loc = value.trim().toLowerCase();
      const index = this.api_data.locationWiseResources.findIndex((item: any) =>
        item.loc.trim().toLowerCase() === loc
      );
      this.setResourcesByLocation(index);
    } else {
      const data = {
        selected_location: this.selected_location,
        selected_resource: this.selected_resource
      }
      this.local_storage.setCalendarLocationCache(data);
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

  errorMessage(field: any) {
    if (field === 'Location') {
      this.commonservice.displayWarning(`Please select valid ${field}`)
      this.selected_location = ''
      this.selected_resource = ''
      this.get_schedule_data(this.currentMonth_date)
    } else {
      this.selected_resource = ''
      if (this.selected_location === '') {
        this.commonservice.displayWarning(`Please select location first`)
        return
      }
      this.commonservice.displayWarning(`Please select valid ${field}`)
    }

  }

  view_all(){
    this.selected_location = ''
    this.selected_resource = ''
    this.get_schedule_data(this.currentMonth_date)
  }

  handleCalendarToggle() {
    this.calendarVisible.update((bool) => !bool);
  }

  handleWeekendsToggle() {
    this.calendarOptions.update((options) => ({
      ...options,
      weekends: !options.weekends,
    }));
  }

  selectedDates: Set<string> = new Set();
  handleDateSelect(selectInfo: DateSelectArg) {
    const calendarApi = selectInfo.view.calendar;
    const wRnumber = this.work_request_id;
    const task_id = this.task_id;
    const title = `${wRnumber}-${task_id}`;

    calendarApi.unselect();

    if (this.duration != 0) {
      let startDate = dayjs(selectInfo.startStr).startOf('day');
      const today = dayjs().startOf('day');

      if (!startDate.isAfter(today)) {
        this.commonservice.displayWarning(
          'Please select a date after the current date to schedule the test.'
        );
        return;
      }

      this.selectedDates.clear();

      let currentDate = startDate.clone();

      while (this.selectedDates.size < this.duration) {
        const dayName = currentDate.format('dddd');
        if (
          !this.selected_resource ||
          this.allowedDays.length === 0 ||
          this.allowedDays.includes(dayName)
        ) {
          this.selectedDates.add(currentDate.format('YYYY-MM-DD'));
        }
        currentDate = currentDate.add(1, 'day');
      }

      const allEvents = calendarApi.getEvents();
      allEvents.forEach((event) => {
        if (event.title === title) {
          event.remove();
        }
      });

      this.selectedDates.forEach((date) => {
        calendarApi.addEvent({
          id: String(new Date().getTime()) + '-' + date,
          title: title,
          start: date,
          end: dayjs(date).add(1, 'day').format('YYYY-MM-DD'),
          allDay: selectInfo.allDay,
          extendedProps: {
            wRnumber: wRnumber,
            taskNumber: task_id
          }
        });
      });

    }
  }

  previousMonth: string | null = null;
  handleMonthChange(info: any) {
    // Get the currently visible month in "MMMM YYYY" format
    const currentMonth = dayjs(info.view.currentStart).format('MMMM YYYY');

    // Run only if this isn't the first render
    if (this.previousMonth) {
      const prev = dayjs(this.previousMonth, 'MMMM YYYY');
      const curr = dayjs(currentMonth, 'MMMM YYYY');

      if (curr.isBefore(prev, 'month')) {
        this.get_schedule_data(currentMonth);
      } else if (curr.isAfter(prev, 'month')) {
        this.get_schedule_data(currentMonth);
      }
    }

    this.previousMonth = currentMonth;
  }

  handleEventClick(info: EventClickArg) {
    const event = info.event;
    const wRnumber = event.extendedProps['wRnumber'];
    const task_id = event.extendedProps['taskNumber'];
    this.task_request_see_detail(wRnumber, task_id);
  }

  handleEvents(events: EventApi[]) {
    this.currentEvents.set(events);
    this.changeDetector.detectChanges();
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

  handleEventDragStart(info: any) {
    const draggedEventId = info.event.id;
    const calendarApi = info.view.calendar;
    const allEvents = calendarApi.getEvents();

    this.hiddenEvents = [];
    allEvents.forEach((event: { id: any; setProp: (arg0: string, arg1: string) => void; }) => {
      if (event.id !== draggedEventId) {
        event.setProp('display', 'none');
        this.hiddenEvents.push(event);
      }
    });
  }

  handleEventDrop(info: any) {
    const event = info.event;
    const task_details = event._def.extendedProps.daysRunning;
    const newStart = new Date(event.start!);
    const runningDays: string[] = event.extendedProps.daysRunning.daysRunning;
    const selectDateDuration = event.extendedProps.daysRunning.dateScheduled.length;

    const getDayName = (date: Date) =>
      date.toLocaleDateString('en-US', { weekday: 'long' });

    const toLocalDate = (d: Date) =>
      new Date(d.getTime() - d.getTimezoneOffset() * 60000);

    let start = toLocalDate(newStart);

    if (!runningDays.includes(getDayName(start))) {
      this.commonservice.displayWarning(
        'The selected resource is unavailable on this day. Please choose a different date.'
      );
      info.revert();
      return;
    }

    const validDates: Date[] = [];
    let tempDate = new Date(start);

    while (validDates.length < selectDateDuration) {
      const dayName = getDayName(tempDate);
      if (runningDays.includes(dayName)) {
        validDates.push(new Date(tempDate));
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }

    const newDates = validDates.map(d =>
      toLocalDate(d).toISOString().split('T')[0]
    );

    // ✅ Pass both arrays to modal
    const drag_reschedule_box = this.dialog.open(drag_reschedule, {
      data: {
        previousDates: event.extendedProps.daysRunning.dateScheduled,
        newDates: newDates,
        eventTitle: event.title,
        task_details: task_details
      },
      width: '400px',
      panelClass: 'custom-dialog-container'
    });

    drag_reschedule_box.afterClosed().subscribe(result => {
      this.get_schedule_data(this.currentDate.format('MMMM YYYY'));
      this.calendarOptions.update(options => ({}));
    });

    this.showAllEvents(info.view.calendar);
  }

  // ✅
  getDateRangeArray(start: Date, end: Date): string[] {
    const dates: string[] = [];
    const current = new Date(start);

    // Inclusive range
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  handleEventDragStop(info: any) {
    this.showAllEvents(info.view.calendar);
  }

  showAllEvents(calendarApi: any) {
    this.hiddenEvents.forEach(event => {
      event.setProp('display', 'auto');
    });
    this.hiddenEvents = [];
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
          }, 1000);
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

                <tr *ngIf= "task_data?.test_Status === 'Submitted' || task_data?.test_Status === 'Approval Pending' || task_data?.test_Status === 'Tentatively Approved'">
                  <th>Action:</th>
                  <td >
                    <div class="btn_div">
                      <button class="yesbtn" (click)="add_to_schedule()" *ngIf="task_data?.test_Status === 'Submitted'">Add to schedule</button>
                      <button class="yesbtn" (click)="view_taskRequest_all_detail(request_data?.workId, task_data?.taskId)" 
                      *ngIf="task_data?.test_Status === 'Approval Pending' || task_data?.test_Status === 'Tentatively Approved'">Approve</button>
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
  styleUrl: './calendar.component.scss'
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
  <div class="container-fluid common_list_modal">
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
  styleUrl: './calendar.component.scss'
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
  styleUrl: './calendar.component.scss'
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

// Drag reschedule 

@Component({
  selector: 'drag_reschedule',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="container-fluid common_list_modal">
    <div class="row">
      <div class="col-12">
        <!-- <h2>This information must be read before proceeding.</h2> -->

          <form>
        <p class="span_proceed">
          <strong>Note:</strong>
          You are rescheduling <strong style="color: #910303;">{{ eventTitle }}</strong> 
          from the following dates:
        </p>

        <div class="span_proceed mt-1" style="color: red;">
          <strong>Previous Dates:</strong> {{ previousDates.join(', ') }}
        </div>

        <div class="span_proceed mt-1" style="color: green; margin-top: 5px;">
          <strong>New Dates:</strong> {{ newDates.join(', ') }}
        </div>

        <p class="span_proceed">
          To confirm this reschedule, please click the 
          <strong style="color: #910303;">Proceed</strong> button.
        </p>

        <div class="btn_div">
          <button class="yesbtn" type="button" *ngIf="!Is_spinner" (click)="schedule_api()" >Proceed</button>
           <button class="yesbtn" *ngIf="Is_spinner">
            <div class="spinner"></div>
          </button>
          <button class="nobtn" type="button" (click)="close()">Cancel</button>
        </div>
      </form>
      </div>
    </div>
  </div>
  `,
  styleUrl: './calendar.component.scss'
})

export class drag_reschedule {

  // ✅ Add these variables to store passed dates
  previousDates: string[] = [];
  newDates: string[] = [];
  eventTitle: string = '';
  task_details: any
  constructor(
    public dialogRef: MatDialogRef<drag_reschedule>,
    private api_service: AllApiServiceService,
    private common_service: CommonServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    // ✅ Assign the new ones safely
    this.previousDates = data.previousDates || [];
    this.newDates = data.newDates || [];
    this.previousDates;
    this.newDates
    this.eventTitle = data.eventTitle || '';
    this.task_details = data.task_details;
  }

  close() {
    this.dialogRef.close();
  }

  Is_spinner: boolean = false
  schedule_api() {
    this.Is_spinner = true
    const currentDate = new Date();
    const body = {
      wRnumber: this.task_details.wRnumber,
      taskNumber: this.task_details.taskNumber,
      scheduleDate: this.newDates,
      monthYear: currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      location: this.task_details.location,
      resource: this.task_details.resource,
      userID: "H317697"
    };
    this.api_service.drag_reschedule_request(body).subscribe({
      next: (res) => {
        console.log(res)
        this.Is_spinner = false;
        this.dialogRef.close();
        this.common_service.displaySuccess('Dates updated successfully.');
      }, error: (err) => {
        this.Is_spinner = false;
        this.common_service.displayWarning('Some error occur, Please try again')
      }
    })
  }

}
