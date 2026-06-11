import { Component, signal, ChangeDetectorRef, HostListener, ViewChild, ElementRef, Inject, OnInit, OnDestroy } from '@angular/core';
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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import dayjs from 'dayjs';
import { AuthService, User } from '../Services/auth/auth.service';
import { scheduled, Subscription } from 'rxjs';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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

interface Shutdown {
  date: string;
  reason: string;
}

@Component({
  selector: 'app-calendar',
  imports: [CommonModule, FullCalendarModule, FormsModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss',
  standalone: true,
})

export class CalendarComponent implements OnInit, OnDestroy {
  approversList: any[] = []
  User: User | any;
  private userSubscription !: Subscription;
  user_id: any;
  private destroy$ = new Subject<void>();
  hiddenEvents: any[] = [];
  calendarVisible = signal(true);
  locationOptions: string[] = [];
  selected_location = '';
  resourcesOptions: string[] = [];
  selected_resource = '';
  sceduled_data !: ScheduleEntry[]
  todo: Task[] = [];
  message: any;
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
  userName: any;
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

  constructor(

    private router: Router,
    private changeDetector: ChangeDetectorRef,
    public dialog: MatDialog,
    private authService: AuthService,
    private titleService: Title,
    private local_storage: LocalStorageService,
    private route: ActivatedRoute,
    private api_service: AllApiServiceService,
    private commonservice: CommonServiceService
  ) {

    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.User = user;
      const input = this.User?.userName;
      let parts: any = input?.split('\\');
      if (parts && parts.length > 1) {
        this.user_id = parts[1];
        this.userName = this.user_id + ' - ' + this.User?.displayName
      }
    })

  }

  ngOnInit() {

    this.titleService.setTitle('Calendar | TestTrack HALLIBURTON');
    this.handleRouteParams();
  }

  private handleRouteParams(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const { wRnumber, taskNumber } = params;
        this.message = history.state?.message || '';
        if (wRnumber && taskNumber) {
          const data = this.local_storage.getDataFormCalender();
          if (data) {
            this.initializeFromCalendarData(wRnumber, taskNumber);
          }
        } else {
          this.restoreCachedFilters();
        }

        this.currentMonth_date = this.currentDate.format('MMMM YYYY');
        this.get_schedule_data(this.currentMonth_date);
      });
  }

  private initializeFromCalendarData(wRnumber: string, taskNumber: string): void {
    const data = this.local_storage.getDataFormCalender();

    const expectedUrl = `/calendar/${data.wRnumber}/${data.taskNumber}`;
    if (this.router.url !== expectedUrl) {
      this.router.navigate(['calendar']);
      return;
    }
    this.work_request_id = data.wRnumber;
    this.task_id = data.taskNumber;
    this.duration = data.duration;
    this.selected_location = data.location;
    this.selected_resource = data.resource;

    this.local_storage.setCalendarLocationCache({
      selected_location: this.selected_location,
      selected_resource: this.selected_resource
    });

    this.commonservice.displaySuccess(
      `Kindly choose ${data.duration} test dates for Task Id ${this.task_id} of Work Request ${this.work_request_id}.`
    );

    this.dialog.open(submit_approval_message, {
      width: '300px',
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });
  }

  private restoreCachedFilters(): void {
    const cached = this.local_storage.getCalendarLocationCache();
    this.selected_location = cached?.selected_location;
    this.selected_resource = cached?.selected_resource;
    console.log('Restored cached filters:', cached);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.userSubscription?.unsubscribe();
  }

  api_data: any
  allowedDays: string[] = [];
  isLoading: boolean = true;
  resourceShutdownDates: Shutdown[] = [];
  normalizedShutdownDates: string[] = [];
  get_schedule_data(month_date: any) {
    this.todo = [];
    this.isLoading = true;

    this.api_service.get_schedule_data_calendar(month_date).subscribe({
      next: (value: any) => {
        this.api_data = value;
        this.isLoading = false;
        console.log('API Response:', this.api_data);
        let data = this.api_data.dateWiseSchedule;

        if (this.selected_location) {
          data = data.map((entry: ScheduleEntry) => ({
            ...entry,
            tasks: entry.tasks
              .map((taskGroup: Task[]) =>
                taskGroup.filter((task: Task) => task.location === this.selected_location)
              )
              .filter((taskGroup: Task[]) => taskGroup.length > 0),
          })).filter((entry: ScheduleEntry) => entry.tasks.length > 0);
        }

        if (this.selected_resource) {
          data = data.map((entry: ScheduleEntry) => ({
            ...entry,
            tasks: entry.tasks
              .map((taskGroup: Task[]) =>
                taskGroup.filter((task: Task) => task.resource === this.selected_resource)
              )
              .filter((taskGroup: Task[]) => taskGroup.length > 0),
          })).filter((entry: ScheduleEntry) => entry.tasks.length > 0);
        }

        this.sceduled_data = data;
        // Extracting location options for the UI
        this.locationOptions = this.api_data.locationWiseResources.map((item: { loc: any }) => item.loc);

        const tasks: Task[] = [];
        this.sceduled_data.forEach((entry: ScheduleEntry) => {
          entry.tasks.forEach((taskGroup: Task[]) => {
            tasks.push(...taskGroup);
          });
        });

        this.todo = tasks;

        if (this.selected_resource) {
          const selectedResourceInfo = this.api_data?.resourceWiseAvailableDay?.find(
            (res: { resource: any }) => res.resource === this.selected_resource
          );

          // const resourceWiseShutdown = this.api_data?.resourceWiseShutdown?.find(
          //   (res: { resource: any }) => res.resource === this.selected_resource
          // );

          this.allowedDays = selectedResourceInfo?.daysRunning?.split(',').map((day: string) => day.trim()) ?? [];
          const approversList = selectedResourceInfo?.approvers.split(",") || [];
          this.approversList = approversList.map((approver: string) => approver.trim());
          this.resourceShutdownDates =
            (this.api_data?.resourceWiseShutdown || [])
              .filter((x: any) => x.resource === this.selected_resource)
              .map((x: any) => ({
                date: x.shutDownDates?.trim(),
                reason: x.reason || 'No reason provided'
              }));
          // this.normalizedShutdownDates = this.resourceShutdownDates.map((date: string) => date.trim());
          console.log('Allowed Days for', this.resourceShutdownDates)
        }

        const getConsecutiveRanges = (dates: string[]) => {
          if (!dates || !dates.length) return [];

          const sortedDates = dates.map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime());
          const ranges: { start: string; end: string }[] = [];
          let rangeStart = sortedDates[0];
          let prev = sortedDates[0];

          sortedDates.slice(1).forEach(date => {
            const diff = (date.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
              prev = date;
            } else {
              ranges.push({
                start: rangeStart.toISOString().split('T')[0],
                end: new Date(prev.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              });
              rangeStart = date;
              prev = date;
            }
          });

          ranges.push({
            start: rangeStart.toISOString().split('T')[0],
            end: new Date(prev.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });

          return ranges;
        };

        const mappedEvents: any[] = [];
        this.todo.forEach(task => {
          const ranges = getConsecutiveRanges(task.dateScheduled);
          ranges.forEach(range => {
            mappedEvents.push({
              id: `${task.taskNumber}-${range.start}`,
              title: `${task.wRnumber}-${task.taskNumber} - ${task.description}`,
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

        // Update calendar options
        console.log('Editable:', this.approversList, this.userName)
        this.calendarOptions.update(options => ({
          ...options,
          editable: (this.User?.role === 'Admin' || this.approversList.includes(this.userName)) && this.todo.some(task => task.status !== 'Completed'),
          events: mappedEvents,
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
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    aspectRatio: 2.3,
    fixedWeekCount: false,

    select: (info) => this.handleDateSelect(info),
    dateClick: (info) => this.handleDateClick(info),
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

    // --- ONLY RETURN CLASSES HERE ---
    dayCellClassNames: (arg) => {
      const dayName = dayjs(arg.date).format('dddd');
      const dateStr = dayjs(arg.date).format('YYYY-MM-DD');

      const classes: string[] = [];

      if (this.selected_resource && this.allowedDays.length > 0 && !this.allowedDays.includes(dayName)) {
        classes.push('fc-day-disabled');
      }

      if (this.resourceShutdownDates.some((d: any) => d.date === dateStr)) {
        classes.push('fc-day-shutdown');
      }

      return classes;
    },

    // --- MANIPULATE DOM / ADD WATERMARK ---
    //   dayCellDidMount: (arg) => {
    //     const dateStr = dayjs(arg.date).format('YYYY-MM-DD');
    //      const shutdown = this.resourceShutdownDates.find(
    //   (d: any) => d.date === dateStr
    // );
    //  if (shutdown) {
    //      const el = arg.el; // DOM element
    //       el.style.position = 'relative'; // ensure child is positioned correctly
    //       el.title = `Shutdown: ${shutdown?.reason}`;
    //       alert(`Resource Shutdown on ${dateStr}: ${shutdown?.reason}`)
    //       const watermark = document.createElement('div');
    //       watermark.textContent = shutdown?.reason;
    //       watermark.style.position = 'absolute';
    //       watermark.style.top = '50%';
    //       watermark.style.left = '50%';
    //       watermark.style.transform = 'translate(-50%, -50%) rotate(-30deg)';
    //       watermark.style.fontSize = '1.2em';
    //       watermark.style.fontWeight = 'bold';
    //       watermark.style.color = 'rgba(255, 0, 0, 0.3)';
    //       watermark.style.pointerEvents = 'none';

    //       el.appendChild(watermark);
    //  }
    //   },

    datesSet: (info) => this.handleMonthChange(info)
  });

  isAddShutdown: boolean = false;
  selectedDateForShutdown: string[] = [];

  isRemoveShutdown: boolean = false;
  selectedDateForRemoveShutdown: string[] = [];

  restartMode: boolean = false;
  handleDateClick(info: any) {

    if (this.duration !== '') return;

    const el = info.dayEl as HTMLElement;
    const dateStr = info.dateStr;

    // -----------------------------
    // FIXED: shutdown detection
    // -----------------------------
    const shutdown = this.resourceShutdownDates.find(
      (d: any) => d.date === dateStr
    );

    const isShutdownDate = !!shutdown;

    // -----------------------------
    // Prevent mixing add/remove flows
    // -----------------------------
    if (isShutdownDate && this.selectedDateForShutdown.length > 0) {
      this.commonservice.displayWarning(
        'You cannot select shutdown and restart dates together.'
      );
      return;
    }

    if (!isShutdownDate && this.selectedDateForRemoveShutdown.length > 0) {
      this.commonservice.displayWarning(
        'You cannot mix shutdown removal with new shutdown selection.'
      );
      return;
    }

    const date = new Date(dateStr);
    const dayName = [
      "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ][date.getDay()];

    // =====================================================
    // 1. REMOVE SHUTDOWN MODE (existing shutdown dates)
    // =====================================================
    if (isShutdownDate) {

      this.restartMode = true;

      const alreadySelected =
        this.selectedDateForRemoveShutdown.includes(dateStr);

      if (alreadySelected) {
        el.classList.remove('fc-remove-shutdown');
        el.querySelector('.restart-checkbox')?.remove();

        this.selectedDateForRemoveShutdown =
          this.selectedDateForRemoveShutdown.filter(d => d !== dateStr);

        this.isRemoveShutdown = this.selectedDateForRemoveShutdown.length > 0;
        return;
      }

      el.classList.add('fc-remove-shutdown');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'restart-checkbox';
      checkbox.checked = true;

      checkbox.style.position = 'absolute';
      checkbox.style.top = '2px';
      checkbox.style.right = '2px';

      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();

        if (!checkbox.checked) {
          el.classList.remove('fc-remove-shutdown');
          checkbox.remove();

          this.selectedDateForRemoveShutdown =
            this.selectedDateForRemoveShutdown.filter(d => d !== dateStr);

          this.isRemoveShutdown =
            this.selectedDateForRemoveShutdown.length > 0;
        }
      });

      el.style.position = 'relative';
      el.appendChild(checkbox);

      if (!this.selectedDateForRemoveShutdown.includes(dateStr)) {
        this.selectedDateForRemoveShutdown.push(dateStr);
      }

      this.isRemoveShutdown = true;
      return;
    }

    // =====================================================
    // 2. ADD SHUTDOWN MODE (new shutdown creation)
    // =====================================================

    if (!this.allowedDays.includes(dayName)) {
      this.commonservice.displayWarning(
        'The resource is not available on this date. Please select a different date.'
      );
      return;
    }

    const isAlreadySelected =
      this.selectedDateForShutdown.includes(dateStr);

    if (isAlreadySelected) {
      el.classList.remove('fc-day-clicked');
      el.querySelector('.day-checkbox')?.remove();

      this.selectedDateForShutdown =
        this.selectedDateForShutdown.filter(d => d !== dateStr);

      this.isAddShutdown = this.selectedDateForShutdown.length > 0;
      return;
    }

    el.classList.add('fc-day-clicked');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'day-checkbox';
    checkbox.checked = true;

    checkbox.style.position = 'absolute';
    checkbox.style.top = '2px';
    checkbox.style.left = '2px';

    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();

      if (!checkbox.checked) {
        el.classList.remove('fc-day-clicked');
        checkbox.remove();

        this.selectedDateForShutdown =
          this.selectedDateForShutdown.filter(d => d !== dateStr);

        this.isAddShutdown =
          this.selectedDateForShutdown.length > 0;
      }
    });

    el.style.position = 'relative';
    el.appendChild(checkbox);

    if (!this.selectedDateForShutdown.includes(dateStr)) {
      this.selectedDateForShutdown.push(dateStr);
    }

    this.isAddShutdown = true;
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
      const data = {
        selected_location: this.selected_location,
        selected_resource: ''
      }
      this.local_storage.setCalendarLocationCache(data);
      this.setResourcesByLocation(index);
      // this.normalizedShutdownDates = [];
      this.get_schedule_data(this.currentMonth_date)
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

  view_all() {
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
      if (startDate.isBefore(today)) {
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
      this.task_request_see_detail(wRnumber, task_id);
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
      this.currentMonth_date = currentMonth;
      if (curr.isBefore(prev, 'month')) {
        this.normalizedShutdownDates = [];
        this.selectedDateForShutdown = [];
        this.get_schedule_data(currentMonth);
      } else if (curr.isAfter(prev, 'month')) {
        this.get_schedule_data(currentMonth);
        this.normalizedShutdownDates = [];
        this.selectedDateForShutdown = [];
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
      case 'Paused': return 'rgb(191 151 6)';
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

  //  handleEventDrop(info: any) {

  //   const event = info.event;
  //   const task_details = event._def.extendedProps.daysRunning;
  //   const newStart = new Date(event.start!);
  //   const runningDays: string[] = event.extendedProps.daysRunning.daysRunning;
  //   const selectDateDuration = event.extendedProps.daysRunning.dateScheduled.length;

  //   const getDayName = (date: Date) =>
  //     date.toLocaleDateString('en-US', { weekday: 'long' });

  //   const toLocalDate = (d: Date) =>
  //     new Date(d.getTime() - d.getTimezoneOffset() * 60000);

  //   let start = toLocalDate(newStart);

  //   if (!runningDays.includes(getDayName(start))) {
  //     this.commonservice.displayWarning(
  //       'The selected resource is unavailable on this day. Please choose a different date.'
  //     );
  //     info.revert();
  //     return;
  //   }

  //   const validDates: Date[] = [];
  //   let tempDate = new Date(start);

  //   while (validDates.length < selectDateDuration) {
  //     const dayName = getDayName(tempDate);
  //     if (runningDays.includes(dayName)) {
  //       validDates.push(new Date(tempDate));
  //     }
  //     tempDate.setDate(tempDate.getDate() + 1);
  //   }

  //   const newDates = validDates.map(d =>
  //     toLocalDate(d).toISOString().split('T')[0]
  //   );

  //   // ✅ Pass both arrays to modal
  //   const drag_reschedule_box = this.dialog.open(drag_reschedule, {
  //     data: {
  //       user_id: this.user_id,
  //       previousDates: event.extendedProps.daysRunning.dateScheduled,
  //       newDates: newDates,
  //       eventTitle: event.title,
  //       task_details: task_details
  //     },
  //     width: '400px',
  //     panelClass: 'custom-dialog-container'
  //   });

  //   drag_reschedule_box.afterClosed().subscribe(result => {
  //     this.get_schedule_data(this.currentDate.format('MMMM YYYY'));
  //     this.calendarOptions.update(options => ({}));
  //   });

  //   this.showAllEvents(info.view.calendar);
  // }

  handleEventDrop(info: any) {
    const status = info.event._def.extendedProps.daysRunning.status;
    if (status === 'Completed') {
      this.commonservice.displayWarning('Completed tasks cannot be rescheduled.')
      info.revert();
      return
    }
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
    const currentDate = new Date();

    let invalidDate = false;

    while (validDates.length < selectDateDuration) {
      const dayName = getDayName(tempDate);

      if (runningDays.includes(dayName)) {
        if (tempDate < currentDate && tempDate.getDate() !== currentDate.getDate()) {
          invalidDate = true;
        } else {
          validDates.push(new Date(tempDate));
        }
      }
      tempDate.setDate(tempDate.getDate() + 1);
    }
    if (invalidDate) {
      this.commonservice.displayWarning(
        'Please select a date starting from today or any future date. Dates in the past are not allowed.'
      );
      info.revert();
      return;
    }

    const newDates = validDates.map(d =>
      toLocalDate(d).toISOString().split('T')[0]
    );

    // ✅ Pass both arrays to modal
    const drag_reschedule_box = this.dialog.open(drag_reschedule, {
      data: {
        user_id: this.user_id,
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
    this.api_service.get_workrequest_details(wRnumber).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (!Array.isArray(res) || res.length === 0) {
          console.warn("No details found for the work request.");
          return;
        }
        const requestData = res[0];
        const selectedLoc = this.selected_location?.trim().toLowerCase();
        const locationData = this.api_data.locationWiseResources.find(
          (item: any) => item.loc.trim().toLowerCase() === selectedLoc
        );

        const resourcesOptions: string[] = locationData?.res || [];
        const detailDialogRef = this.dialog.open(calendar_schedule_date_detail, {
          width: '700px',
          data: {
            data: requestData, task_id, User: this.User, selected_dates: this.selectedDates,
            user_id: this.user_id, userRole: this.User?.role, userName: this.userName,
            resourcesOptions: resourcesOptions, approversList: this.approversList
          },
          disableClose: true
        });

        detailDialogRef.afterClosed().subscribe(detailResult => {
          if (detailResult?.message === 'Yes') {
            this.request_data_scheduled = detailResult.task;
            setTimeout(() => {
              if (this.message === 'Update') {
                this.update_schedule_api(wRnumber, task_id);
              } else {
                this.schedule_api(wRnumber, task_id);
              }
            }, 1000);
          } else if (detailResult?.message === 'Resource Updated') {
            this.isLoading = true;
            this.currentMonth_date = this.currentDate.format('MMMM YYYY');
            this.get_schedule_data(this.currentMonth_date);
          }
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
    const body = {
      wRnumber: wRnumber,
      taskNumber: task_id,
      scheduleDate: [...this.selectedDates],
      monthYear: this.currentDate.format('MMMM YYYY'),
      location: this.request_data_scheduled.location,
      resource: this.request_data_scheduled.resource,
      userID: this.user_id
    };
    this.isLoading = true;
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
          this.router.navigate(['/calendar']);
        }

      }, error: (err) => {
        console.log(err)
        this.isLoading = false;
        this.commonservice.displayWarning('Some error occur, Please try again')
      }
    })
  }

  update_schedule_api(wRnumber: any, task_id: any) {
    const body = {
      wRnumber: wRnumber,
      taskNumber: task_id,
      scheduleDate: [...this.selectedDates],
      monthYear: this.currentDate.format('MMMM YYYY'),
      location: this.request_data_scheduled.location,
      resource: this.request_data_scheduled.resource,
      existingScheduleID: this.request_data_scheduled.scheduleID,
      userID: this.user_id
    };
    console.log('Update Request Body:', body);
    this.isLoading = true;
    this.api_service.drag_reschedule_request(body).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.commonservice.displaySuccess('Dates updated successfully.');
        const data = {
          location: this.selected_location,
          resource: this.selected_resource,
        };
        if (data) {
          this.local_storage.setDataFormCalender(data);
          this.router.navigate(['/calendar']);
        }
      }, error: (err) => {
        this.isLoading = false;
        this.commonservice.displayWarning('Some error occur, Please try again')
      }
    })
  }

  shutDown_Resource(message: string) {
    const selectedLoc = this.selected_location?.trim().toLowerCase();
    const locationData = this.api_data.locationWiseResources.find(
      (item: any) => item.loc.trim().toLowerCase() === selectedLoc
    );

    const resourcesOptions: string[] = locationData?.res || [];
    const selectedDate =
      message === 'Shutdown'
        ? this.selectedDateForShutdown.join(', ')
        : this.selectedDateForRemoveShutdown.join(', ');

    const shutdown_box = this.dialog.open(shutDownResource, {
      width: '400px',
      maxHeight: '2000px',
      panelClass: 'custom-dialog-container',
      data: {
        user_id: this.user_id, location: this.selected_location, resourcesOptions: resourcesOptions,
        resource: this.selected_resource, selectedDate: selectedDate, task_id: '', message: message,
      },
      disableClose: true
    });

    shutdown_box.afterClosed().subscribe(detailResult => {

      if (detailResult === 'yes') {
        this.isLoading = true;
        this.selectedDateForShutdown = [];
        this.selectedDateForRemoveShutdown = [];

        this.resourceShutdownDates = [];
        this.normalizedShutdownDates = [];

        this.isAddShutdown = false;
        this.isRemoveShutdown = false;

        document
          .querySelectorAll('.day-checkbox, .restart-checkbox')
          .forEach((el: any) => el.remove());

        document
          .querySelectorAll('.fc-day-clicked, .fc-remove-shutdown')
          .forEach((el: any) => {
            el.classList.remove('fc-day-clicked');
            el.classList.remove('fc-remove-shutdown');
          });

        this.request_data_scheduled = detailResult.task;

        setTimeout(() => {

          this.get_schedule_data(
            this.currentDate.format('MMMM YYYY')
          );

        }, 1000);
        if (message === 'Shutdown') {
          this.commonservice.displaySuccess('Resource shutdown successfully.')
        } else {
          this.commonservice.displaySuccess('Resource restart successfully.')
        }
      }
    });
  }

}

// Show Data 
@Component({
  selector: 'calendar_schedule_date_detail',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule
  ],
  template: `
<div class="container-fluid calendar_schedule_date_detail ">
    <div class="row">
        <div class="col-12">
            <h2>Detail of request on selected Date <i class="bi bi-x-circle" (click)="close()"
                    style="cursor: pointer;"></i></h2>

            <div class="data_of_request">
                <table class="table table-bordered table-fixed">
                    <thead>
                        <tr>
                            <th>Work Request ID:</th>
                            <td><a
                                    (click)="view_workRequest_all_detail(request_data?.workId)">{{request_data?.workId}}</a>
                            </td>
                        </tr>

                        @if(task_data?.charge_Codes){
                        <tr>
                            <th>Charge Code:</th>
                            <td>{{task_data?.charge_Codes}}</td>
                        </tr>
                        }

                        @if(task_data?.work_Orders){
                        <tr>
                            <th>Work Order:</th>
                            <td>{{task_data?.work_Orders}}</td>
                        </tr>
                        }

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
                            <td><a
                                    (click)="view_taskRequest_all_detail(request_data?.workId, task_data?.taskId)">{{task_data?.taskId}}</a>
                            </td>
                        </tr>

                        <tr>
                            <th>Location:</th>
                            <td>{{task_data?.location}}</td>
                        </tr>

                        <tr *ngIf="!isChangeResource">
                            <th>Resource:</th>
                            <td>{{task_data?.resource}} <button class="resource_change"
                                    (click)="isChangeResource = !isChangeResource">Change Resource</button></td>
                        </tr>

                        <tr *ngIf="isChangeResource">
                            <th>Resource:</th>
                            <td>
                                <div class="form_field">
                                    <div class="form_field_dropdown" style="width: 100%;">
                                        <input id="Resource" [(ngModel)]="selected_resource" type="text"
                                            (click)="show('resourcesOptions')" (ngModelChange)="filteredAutocomplete()"
                                            [ngModelOptions]="{standalone: true}" class="form-control"
                                            placeholder="Search Resource" #inputField>
                                        <ul *ngIf="resourcesOptions.length !=0 && showlistresourcesOptions"
                                            class="list_drop" #dropdownContainer style="width: 345px !important;">
                                            <li *ngFor="let option of resourcesOptions"
                                                (click)="option !== 'No data with this search' ? filterData(option) : errorMessage('Resource')">
                                                {{option}}
                                            </li>
                                        </ul>
                                        <ul *ngIf="resourcesOptions.length === 0 && showlistresourcesOptions"
                                            class="list_drop" #dropdownContainer>
                                            <li (click)="errorMessage('Resource')">
                                                Please Select Location First
                                            </li>
                                        </ul>
                                    </div>
                                    <div style="display: flex; gap: 4px; margin-top: 5px; justify-content: flex-end;">
                                        <button class="resource_change" style="width: max-content; padding: 2px;"
                                            (click)="updateResource()" *ngIf="!Is_spinner">
                                            Update Resource
                                        </button>
                                        <button class="resource_change" *ngIf="Is_spinner">
            <div class="spinner"></div>
        </button>
                                        <button class="resource_change" style="margin-left: 5px !important;" 
                                            (click)="isChangeResource = !isChangeResource">Back</button>
                                    </div>
                                </div>

                            </td>
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

                        <tr *ngIf="task_data?.test_Status === 'Submitted'">
                            <th>Selected Dates:</th>
                            <td class="d-flex" style="align-items: center;">
                                <span>
                                    {{ selected_dates[0]}} to {{ selected_dates[selected_dates.length-1] }}
                                </span>
                                <h6 style="color: red !important; font-weight:700;font-size: 1em; margin-left: 4px">
                                    (Except non running days)
                                </h6>

                            </td>
                        </tr>

                        <tr *ngIf="task_data?.test_Status === 'Submitted' || task_data?.test_Status === 'Approval Pending' || task_data?.test_Status === 'Tentatively Approved' || task_data?.test_Status === 'Paused'
                || task_data?.test_Status === 'In Progress'|| task_data?.test_Status === 'Approved'">
                            <th>Action:</th>
                            <td>
                                <div class="btn_div">
                                    <button class="yesbtn" (click)="add_to_schedule()"
                                        *ngIf="task_data?.test_Status === 'Submitted'">Add to schedule</button>
                                    <button class="yesbtn"
                                        (click)="approve_TaskRequest(request_data?.workId, task_data?.taskId)"
                                        *ngIf="task_data?.test_Status === 'Approval Pending' || task_data?.test_Status === 'Tentatively Approved'">Approve</button>
                                    <button class="yesbtn" (click)="routetoTaskInterface(task_data?.taskId)"
                                        *ngIf="task_data?.test_Status === 'Paused' || task_data?.test_Status === 'In Progress'|| task_data?.test_Status === 'Approved'">
                                        Complete Test
                                    </button>
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
  User: any
  approversList: any
  userName: any
  userRole: any
  selected_dates: any
  selected_resource = ''
  resourcesOptions: any
  isChangeResource: boolean = false;
  showlistresourcesOptions: boolean = false;
  user_id: any
  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef;
  @ViewChild('inputField') inputField!: ElementRef;
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {

    if (!this.inputField || !this.dropdownContainer) {
      return;
    }

    const clickedInsideInput = this.inputField.nativeElement.contains(event.target)
    const clickedInsideDropdown = this.inputField.nativeElement.contains(event.target)
    if (!clickedInsideInput && !clickedInsideDropdown) {
      this.showlistresourcesOptions = false
    }

  }
  constructor(public detailDialogRef: MatDialogRef<calendar_schedule_date_detail>,
    private commonservice: CommonServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private router: Router,
    private api_service: AllApiServiceService,
    public dialog: MatDialog,) {
    this.request_data = data.data.workRequestLists[0]
    this.User = data.User
    this.resourcesOptions = data.resourcesOptions
    this.user_id = data.user_id
    this.approversList = data.approversList
    this.userName = data.userName
    this.userRole = data.userRole
    if (data.task_id) {
      const index = data.data.taskLists.findIndex((task: any) => task.taskId === data.task_id)
      this.task_data = data.data.taskLists[index]
      this.selected_resource = this.task_data.resource
    }

    if (this.task_data?.test_Status === 'Submitted') {
      this.selected_dates = [...data.selected_dates]
    }
  }

  getTaskColor(task: string): string {
    switch (task) {
      case 'Requested': return '#0041dc';
      case 'Approved': return '#43b400';
      case 'Completed': return 'black';
      case 'In Progress': return 'rgb(191 151 6)';
      case 'Paused': return 'rgb(191 151 6)';
      case 'Facility shutdown': return '#d90000';
      case 'Draft': return 'rgb(191 178 0)';
      case 'Tentative': return 'rgb(191 178 0)';
      case 'Pending': return 'rgb(191 178 0)';
      default: return 'transparent';
    }
  }

  routetoTaskInterface(value: any): void {
    const taskNumber = value;
    if (taskNumber) {
      this.router.navigate([`tech-interface/${taskNumber}`]);
      this.detailDialogRef.close();
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

  approve_TaskRequest(work_request_no: any, task_request_no: any) {
    if (this.User?.role != 'Admin') {
      this.commonservice.displayWarning('Only Admin can Approve the Task Request. Please contact Admin.')
      return
    }
    window.open(`task-request/detail/${work_request_no}/${task_request_no}`, '_blank')
  }

  add_to_schedule(): void {
    const data = {
      task: this.task_data,
      message: 'Yes'
    }
    this.detailDialogRef.close(data)
  }

  filteredAutocomplete(): void {
    const searchTerm = (String(this.selected_resource) || '').trim().toLowerCase();
    if (searchTerm) {
      this.resourcesOptions = this.resourcesOptions.filter((option: string) =>
        option.toLowerCase().includes(searchTerm)
      );
    } else {
      this.resourcesOptions = this.data.resourcesOptions
    }
  }

  show(value: string): void {
    this.showlistresourcesOptions = true;
  }

  filterData(value: any): void {
    this.selected_resource = value;
  }

  errorMessage(field: any) {
    this.commonservice.displayWarning(`Please select valid ${field}`)
    this.selected_resource = ''
    this.resourcesOptions = this.data.resourcesOptions
    this.showlistresourcesOptions = true
  }

  Is_spinner: boolean = false
  updateResource() {
    if (this.selected_resource && (this.userRole === 'Admin' || this.approversList.includes(this.userName))) {
      this.Is_spinner = true
      const body = {
        "resource": this.selected_resource,
        "taskID": this.task_data?.taskId,
        "userID": this.user_id
      }

      this.api_service.change_schedule_request(body).subscribe({
        next: (res: any) => {
          this.commonservice.displaySuccess('Resource shutdown successfully.')
          this.Is_spinner = false
          const data = {
            task: this.task_data,
            message: 'Resource Updated'
          }
          this.detailDialogRef.close(data)
        }
        , error: (err) => {
          this.Is_spinner = false
          console.error('API error:', err);
        }
      })
    } else {
      this.commonservice.displayWarning(`Please select a valid resource`)
    }
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
        <h2>sam Please Confirm Approval For Task Request <strong style="color:green;">{{taskId}}</strong> </h2>
        <form autocomplete="off">
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
  user_id: any
  constructor(public dialogRef: MatDialogRef<cancel_change_to_draft>,
    private api_service: AllApiServiceService,
    private common_service: CommonServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.user_id = data.user_id
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
        // UserID: 'H317697',
        UserID: this.user_id,
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

          <form autocomplete="off">
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

  previousDates: string[] = [];
  newDates: string[] = [];
  eventTitle: string = '';
  task_details: any
  user_id: any
  constructor(
    public dialogRef: MatDialogRef<drag_reschedule>,
    private api_service: AllApiServiceService,
    private common_service: CommonServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.user_id = data.user_id;
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
      existingScheduleID: this.task_details.scheduleID,
      userID: this.user_id
    };
    this.api_service.drag_reschedule_request(body).subscribe({
      next: (res) => {
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

// Instruction to add to scheduled

@Component({
  selector: 'submit_approval_message',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule
  ],
  template: `
  <div class="container-fluid add_tool">
    <div class="row">
      <div class="col-12">
        <!-- <h2>This information must be read before proceeding.</h2> -->

        <form autocomplete="off">
        <span class="span_proceed">
          <strong>Note:</strong> <br>
        Select a start date on the calendar and then click on blue bar to 'Add to schedule'
        </span>
        <div class="btn_div">
        <button class="yesbtn" (click)="submit_yes('yes')">Okay</button>
        </div>
        </form>
      </div>
    </div>
  </div>
  `,
  styleUrl: '../new-request-form/new-request-form.component.scss'
})

export class submit_approval_message {

  constructor(
    public dialogRef: MatDialogRef<submit_approval_message>) { }

  submit_yes(data: any) {
    if (data === 'yes') {
      this.dialogRef.close('yes')
    }
  }

}

// ShutDown

@Component({
  selector: 'shutDownResource',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule
  ],
  template: `
 <div class="container-fluid add_tool">
    <div class="row">
        <div class="col-12">

            <form autocomplete="off">
                <div class="form_field">
                    <label for="Reason">Reason: </label>
                    <div class="form_field_dropdown" style="width: 100%;">
                        <input id="Reason"  [(ngModel)]="reason" [ngModelOptions]="{standalone: true}"
                            type="text" class="form-control" placeholder="Search Reason" #inputField>

                    </div>
                </div>
                <div class="form_field">
                    <label for="Location">Location: </label>
                    <div class="form_field_dropdown" style="width: 100%;">
                        <input id="Location" [(ngModel)]="selected_location" type="text"
                            [ngModelOptions]="{standalone: true}" readonly class="form-control"
                            placeholder="Search Location" #inputField>
                    </div>
                </div>

                <div class="form_field">
                    <label for="Resource">Resource: </label>
                    <div class="form_field_dropdown" style="width: 100%;">
                        <input id="Resource" [(ngModel)]="selected_resource" type="text"
                            (click)="show('resourcesOptions')" (ngModelChange)="filteredAutocomplete()"
                            [ngModelOptions]="{standalone: true}" class="form-control" placeholder="Search Resource"
                            #inputField>
                        <ul *ngIf="resourcesOptions.length !=0 && showlistresourcesOptions" class="list_drop"
                            #dropdownContainer style="width: 345px !important;">
                            <li *ngFor="let option of resourcesOptions"
                                (click)="option !== 'No data with this search' ? filterData(option) : errorMessage('Resource')">
                                {{option}}
                            </li>
                        </ul>
                        <ul *ngIf="resourcesOptions.length === 0 && showlistresourcesOptions" class="list_drop"
                            #dropdownContainer>
                            <li (click)="errorMessage('Resource')">
                                Please Select Location First
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="btn_div">
                  @if(message === 'Shutdown'){
                    <button class="yesbtn" (click)="submit_yes('yes')" *ngIf="!Is_spinner">Add Shutdown</button>
                  }@else{
                    <button class="yesbtn" (click)="remove_shutdown('yes')" *ngIf="!Is_spinner">Remove Shutdown</button>
                  }
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
  styleUrl: '../new-request-form/new-request-form.component.scss'
})

export class shutDownResource {
  user_id: any
  task_id: any
  selected_location = ''
  selected_resource = ''
  selectedDates = ''
  message: any
  reason = ''
  resourcesOptions: any
  Is_spinner: boolean = false
  showlistresourcesOptions: boolean = false
  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef;
  @ViewChild('inputField') inputField!: ElementRef;
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {

    if (!this.inputField || !this.dropdownContainer) {
      return;
    }

    const clickedInsideInput = this.inputField.nativeElement.contains(event.target)
    const clickedInsideDropdown = this.inputField.nativeElement.contains(event.target)
    if (!clickedInsideInput && !clickedInsideDropdown) {
      this.showlistresourcesOptions = false
    }

  }
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public api_service: AllApiServiceService,
    private commonservice: CommonServiceService,
    public shutdown_box: MatDialogRef<shutDownResource>) {
    this.user_id = data.user_id
    this.task_id = data.task_id
    this.selected_location = data.location
    this.selected_resource = data.resource
    this.selectedDates = data.selectedDate
    this.resourcesOptions = data.resourcesOptions
    this.message = data.message

    if (data.message === 'Remove Shutdown') {
      this.message = 'Shutdown Over'
    } else {
      this.message = 'Shutdown'
    }
  }

  submit_yes(data: any) {
    if (this.reason === '') {
      this.commonservice.displayWarning('Please provide a reason for shutdown')
      return
    }
    if (this.selected_resource === '') {
      this.commonservice.displayWarning('Please select a valid resource')
      return
    }

    this.Is_spinner = true
    const body = {
      "resource": this.selected_resource,
      "taskID": 'TK033',
      "shutDownDates": this.selectedDates,
      "userID": this.user_id,
      "reason": this.reason
    }
    console.log(body)
    this.api_service.shutDown_Resource(body).subscribe({
      next: (res: any) => {
        if (res.status) {

          this.Is_spinner = false
          this.shutdown_box.close('yes')
        }
      }
      , error: (err) => {
        this.Is_spinner = false
        console.error('API error:', err);
      }
    })
  }

  remove_shutdown(data: any) {
    if (this.reason === '') {
      this.commonservice.displayWarning('Please provide a reason for shutdown')
      return
    }
    if (this.selected_resource === '') {
      this.commonservice.displayWarning('Please select a valid resource')
      return
    }
    this.Is_spinner = true
    const body = {
      "resource": this.selected_resource,
      "taskID": 'TK033',
      "shutDownDates": this.selectedDates,
      "userID": this.user_id,
      "reason": this.reason
    }
    console.log(body)
    this.api_service.removeShutdown_Resource(body).subscribe({
      next: (res: any) => {
        if (res.status) {

          this.Is_spinner = false
          this.shutdown_box.close('yes')
        }
      }
      , error: (err) => {
        this.Is_spinner = false
        console.error('API error:', err);
      }
    })
    this.shutdown_box.close('yes')
  }

  close() {
    this.shutdown_box.close()
  }

  filteredAutocomplete(): void {
    const searchTerm = (String(this.selected_resource) || '').trim().toLowerCase();
    if (searchTerm) {
      this.resourcesOptions = this.resourcesOptions.filter((option: string) =>
        option.toLowerCase().includes(searchTerm)
      );
    } else {
      this.resourcesOptions = this.data.resourcesOptions
    }
  }

  show(value: string): void {
    this.showlistresourcesOptions = true;
  }

  filterData(value: any): void {
    this.selected_resource = value;
  }

  errorMessage(field: any) {
    this.commonservice.displayWarning(`Please select valid ${field}`)
    this.selected_resource = ''
    this.resourcesOptions = this.data.resourcesOptions
    this.showlistresourcesOptions = true
  }
}