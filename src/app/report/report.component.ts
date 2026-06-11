import { Component, ElementRef, NgZone, ViewChild, HostListener } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import * as XLSX from 'xlsx';
import { AllApiServiceService } from '../Services/all-api-service.service';
import { Router } from '@angular/router';
import { CommonServiceService } from '../Services/common-service.service';
import { AuthService, User } from '../Services/auth/auth.service';
import { Subscription } from 'rxjs';

interface Task {
  taskNumber: string;
  description: string;
  startDate: string;
  endDate: string;
  hour: number;
  cost: number;
  activity_Code: string;
  charge_Code: string;
  group: string;
  resource: string;
  tool: string;
  perHourRate: number;
  psl: string;
}

interface TaskGroup {
  hour: number;
  cost: number;
  taskNumbers: Task[][];
}

interface PSLData {
  psl: string;
  hour: number;
  cost: number;
  data: TaskGroup[];
}

@Component({
  selector: 'app-report',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './report.component.html',
  styleUrl: './report.component.scss',
  standalone: true,
  providers: [DatePipe]
})

export class ReportComponent {

  chargeCode_search: any = ''
  Resource_search: any = ''
  Tool_search: any = ''
  psl_search: any = ''
  group_search: any = ''
  startDate: any = '';
  endDate: any = '';
  date: any;
  User: User | null | undefined;
  private userSubscription !: Subscription;
  user_role: any;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  @ViewChild('dropDownContainer') dropDownContainer !: ElementRef;
  @ViewChild('inputField') inputField!: ElementRef;
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    if (this.selectedFilterValue !== 'Resource') return;
    const clickedInside = this.dropDownContainer?.nativeElement.contains(event.target) ||
      this.inputField?.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.resourceList = [];
    }
  }


  constructor(private titleService: Title,
    private api_service: AllApiServiceService,
    private authService: AuthService,
    private commonService: CommonServiceService,
    private datePipe: DatePipe,
    private router: Router,
    private ngZone: NgZone) {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.User = user;
      const input = this.User?.userName;
      this.user_role = this.User?.role;
    })
    this.titleService.setTitle("Report | TestTrack HALLIBURTON");
    this.date = new Date();
    this.startPolling();
  }

  ngOnInit(): void { }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  filterOptionList: any = ['Charge Code', 'Resource', 'Tool', 'Group', 'PSL']
  selectedFilterValue: any = 'Select Filter Option'
  expandedIndexes: number[] = [];
  getfilterselectedOption(event: any) {
    this.selectedFilterValue = event.target.value;
  }

  show(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval!);
      this.pollingInterval = null;
      console.log('Polling stopped due to active filters.');
    }
    this.resourceList = this.data;
  }

  startPolling() {
    this.Get_Charge_Out();
    this.ngZone.runOutsideAngular(() => {
      this.pollingInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.Get_Charge_Out();
        });
      }, 5000);
    });
  }

  isLoading: boolean = true;
  all_task: PSLData[] = []
  taskList: Task[] = []
  resourceList: string[] = []
  data: any = []
  Get_Charge_Out() {
    this.api_service.Get_Charge_OutbyYear(this.datePipe.transform(this.date, 'yyyy')).subscribe({
      next: (res: any) => {
        this.all_task = res.chargeOutReport;
        this.data = res.resources;
        this.filteredTasks = this.all_task;
        this.taskList = this.all_task.flatMap((task: any) => {
          return task.data.flatMap((taskData: any) => {
            return taskData.taskNumbers.flatMap((item: any[]) => item);
          })
        });
        // this.filteredAutocomplete()
        // this.filteredTasks = this.all_task.flatMap((task: any) =>task.data)
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching tasks:', err.message);
        this.isLoading = false;
      }
    });
  }



  // --------------------------------------------------------------------
  showViewAll: boolean = false;
  filterByDateRange() {

    if (!this.startDate || !this.endDate) {
      this.commonService.displayWarning('Please enter both start date and end date.');
      return;
    }

    if (!Array.isArray(this.all_task) || this.all_task.length === 0) {
      this.commonService.displayWarning('all_task is not initialized or is empty');
      this.filteredTasks = [];
      this.expandedIndexes = [];
      return;
    }

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval!);
      this.pollingInterval = null;
      console.log('Polling stopped due to active filters.');
    }

    const start: any = this.datePipe.transform(this.startDate, 'yyyy-MM-dd');
    const end: any = this.datePipe.transform(this.endDate, 'yyyy-MM-dd');

    if (start > end) {
      this.commonService.displayWarning('Start date cannot be later than end date.');
      return;
    }
    this.isLoading = true;
    this.api_service.Get_Charge_OutbyStartDate_EndDate(start, end).subscribe({
      next: (res: any) => {
        console.log('Data fetched successfully for date range:', res);
        this.all_task = res.chargeOutReport;
        this.filteredTasks = this.all_task;
        this.isLoading = false;

        this.taskList = (this.all_task ?? []).flatMap((task: any) => {
          return (task.data ?? []).flatMap((taskData: any) => {
            return (taskData.taskNumbers ?? []).flatMap((item: any[]) => item);
          })
        });

        this.showViewAll = true
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching tasks:', err.message);
        this.isLoading = false;
      }
    });
  }

  filteredTasks: any = []
  filteredAutocomplete() {

    if (!this.chargeCode_search && !this.Resource_search && !this.Tool_search && !this.group_search && !this.psl_search) {
      this.filteredTasks = this.all_task;
      this.button_name = "Collapse All"
      return;
    }

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval!);
      this.pollingInterval = null;
      console.log('Polling stopped due to active filters.');
    }

    if (this.selectedFilterValue) {
      const searchValue = this.selectedFilterValue === 'Charge Code' ? this.chargeCode_search :
        this.selectedFilterValue === 'Resource' ? this.Resource_search :
          this.selectedFilterValue === 'Tool' ? this.Tool_search :
            this.selectedFilterValue === 'Group' ? this.group_search :
              this.selectedFilterValue === 'PSL' ? this.psl_search : '';

      const fieldName = this.selectedFilterValue === 'Charge Code' ? 'charge_Code' :
        this.selectedFilterValue === 'Resource' ? 'resource' :
          this.selectedFilterValue === 'Tool' ? 'tool' :
            this.selectedFilterValue === 'Group' ? 'group' :
              this.selectedFilterValue === 'PSL' ? 'psl' : 'psl';

      if (!searchValue) return;
      this.filteredTasks = this.all_task.map((pslItem, pslIndex) => {
        return {
          ...pslItem,
          data: pslItem.data.map(dataItem => {
            return {
              ...dataItem,
              taskNumbers: dataItem.taskNumbers
                .map(taskArray => {
                  return taskArray.filter(task =>
                    task[fieldName].toLowerCase().includes(searchValue.toLowerCase())
                  );
                })
                .filter(taskArray => taskArray.length > 0)
            };
          }).filter(dataItem => dataItem.taskNumbers.length > 0)
        };
      }).filter(pslItem => pslItem.data.length > 0);
      if (this.filteredTasks.length === 0) {
        this.button_name = "Expand All"
      }
      this.updateExpandedTasks(fieldName, searchValue);
    }
  }

  filters = {
    psl: '',
    taskNumber: '',
    group: '',
    resource: '',
    tool: '',
    description: '',
    charge_Code: '',
    activity_Code: ''
  };

  applyFilters() {
  
  if (this.pollingInterval) {
    clearInterval(this.pollingInterval!);
    this.pollingInterval = null;
    console.log('Polling stopped due to active filters.');
  }

  const hasFilter = Object.values(this.filters)
    .some(v => v && v.trim() !== '');

  if (!hasFilter) {
    this.filteredTasks = [...this.all_task];
    this.expandedPSL.clear();
    this.expandedTaskMap.clear();
    this.button_name = "Expand All";
    this.startPolling();
    return;
  }
  
  this.filteredTasks = this.all_task
    .map((pslItem, pslIndex) => {
      const filteredData = pslItem.data
        .map(dataItem => {
          const filteredTaskNumbers = dataItem.taskNumbers
            .map(taskArray => {
              const tasks = taskArray.filter(task => {
                return (
                  (!this.filters.psl || task.psl?.toLowerCase().includes(this.filters.psl.toLowerCase())) &&
                  (!this.filters.taskNumber || task.taskNumber?.toLowerCase().includes(this.filters.taskNumber.toLowerCase())) &&
                  (!this.filters.group || task.group?.toLowerCase().includes(this.filters.group.toLowerCase())) &&
                  (!this.filters.resource || task.resource?.toLowerCase().includes(this.filters.resource.toLowerCase())) &&
                  (!this.filters.tool || task.tool?.toLowerCase().includes(this.filters.tool.toLowerCase())) &&
                  (!this.filters.description || task.description?.toLowerCase().includes(this.filters.description.toLowerCase())) &&
                  (!this.filters.charge_Code || task.charge_Code?.toLowerCase().includes(this.filters.charge_Code.toLowerCase())) &&
                  (!this.filters.activity_Code || task.activity_Code?.toLowerCase().includes(this.filters.activity_Code.toLowerCase()))
                );
              });
              return tasks;
            })
            .filter(taskArray => taskArray.length > 0);

          return { ...dataItem, taskNumbers: filteredTaskNumbers };
        })
        .filter(dataItem => dataItem.taskNumbers.length > 0);

      return { ...pslItem, data: filteredData };
    })
    .filter(pslItem => pslItem.data.length > 0);

  this.expandedPSL.clear();
  this.expandedTaskMap.clear();

  this.filteredTasks.forEach((pslItem: { data: any[]; }, pslIndex: number) => {
    let taskSet = new Set<string>();
    pslItem.data.forEach(dataItem => {
      dataItem.taskNumbers.forEach((taskArray: any[]) => {
        taskArray.forEach((task: any) => {
          taskSet.add(task.taskNumber);
        });
      });
    });

    if (taskSet.size > 0) {
      this.expandedPSL.add(pslIndex);
      this.expandedTaskMap.set(pslIndex, taskSet);
    }
  });

  this.button_name = this.filteredTasks.length > 0 ? "Collapse All" : "Expand All";
}

  filteredResourceList() {

    const searchValue = this.Resource_search?.trim().toLowerCase() || '';
    if (!searchValue) {
      this.resourceList = this.data;
    }
    else {
      this.resourceList = this.data.filter((resource: any) => {
        const cellValue = resource?.[0];
        return typeof cellValue === 'string' &&
          cellValue.toLowerCase().includes(searchValue);
      });
    }
  }

  selectOption(option: any): void {
    this.Resource_search = String(option || '').trim().toLowerCase();
    this.resourceList = [];
    const searchValue = this.Resource_search;
    if (!searchValue) return;
    this.filteredTasks = this.all_task.map((pslItem, pslIndex) => {
      return {
        ...pslItem,
        data: pslItem.data.map(dataItem => {
          return {
            ...dataItem,
            taskNumbers: dataItem.taskNumbers
              .map(taskArray => {
                return taskArray.filter(task =>
                  task['resource']?.toLowerCase().includes(searchValue.toLowerCase())
                );
              })
              .filter(taskArray => taskArray.length > 0)
          };
        }).filter(dataItem => dataItem.taskNumbers.length > 0)
      };
    }).filter(pslItem => pslItem.data.length > 0);
    if (this.filteredTasks.length === 0) {
      this.button_name = "Expand All"
    }
    this.updateExpandedTasks('resource', searchValue);
  }

  updateExpandedTasks(fieldName: string, searchValue: string) {

    this.expandedPSL.clear();
    this.expandedTaskMap.clear();

    this.filteredTasks.forEach((pslItem: any, pslIndex: number) => {

      let expandedTasks = new Set<string>();

      pslItem.data.forEach((dataItem: any) => {
        dataItem.taskNumbers.forEach((taskArray: any[]) => {
          taskArray.forEach((task: any) => {

            if (
              task[fieldName]
                ?.toLowerCase()
                .includes(searchValue.toLowerCase())
            ) {

              this.expandedPSL.add(pslIndex);
              expandedTasks.add(task.taskNumber);
            }
          });
        });
      });

      if (expandedTasks.size > 0) {
        this.expandedTaskMap.set(pslIndex, expandedTasks);
      }
    });

    this.button_name =
      this.filteredTasks.length > 0 ? 'Collapse All' : 'Expand All';
  }

  remove_filter() {
    this.selectedFilterValue = 'Select Filter Option'
    this.button_name = "Expand All"
    this.expandedIndexes = [];
    this.filteredTasks = [];
    this.chargeCode_search = '';
    this.Resource_search = '';
    this.Tool_search = '';
    this.psl_search = '';
    this.group_search = '';
    this.startDate = '';
    this.endDate = '';
    this.isLoading = true;
    this.showViewAll = false;
    this.startPolling();
  }

  routetoTaskInterface(value: any): void {
    const taskNumber = value;
    if (taskNumber) {
      this.router.navigate([`tech-interface/${taskNumber}`]);
    }
  }

  exportToExcel(): void {
  const allowedRoles = ['Admin', 'Tech', 'Lead'];
  if (!allowedRoles.includes(this.user_role)) {
    this.commonService.displayWarning(
      'You do not have permission to export data. Only Admin can export the data.'
    );
    return;
  }

  const rows: any[] = [];

  // Decide whether to export filtered data or all data
  const exportData = (this.filteredTasks && this.filteredTasks.length > 0)
    ? this.filteredTasks
    : this.all_task;

  exportData.forEach((pslItem: any) => {
    pslItem.data.forEach((dataItem: any) => {
      dataItem.taskNumbers.forEach((item: any[]) => {
        item.forEach((task: any) => {
          rows.push({
            TaskNumber: task.taskNumber,
            Description: task.description,
            StartDate: task.startDate?.split('T')[0] || '',
            StartTime: new Date(task.startDate).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }),
            EndDate: task.endDate?.split('T')[0] || '',
            EndTime: new Date(task.endDate).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            }),
            Hours: task.hour,
            PerHourRate: task.perHourRate,
            Cost: task.cost,
            ChargeCode: task.charge_Code,
            WorkOrder: task.work_Order,
            ActivityCode: task.activity_Code,
            Resource: task.resource,
            Tool: task.tool,
            Group: task.group,
            PSL: task.psl,
          });
        });
      });
    });
  });

  if (rows.length === 0) {
    alert('No tasks available to download.');
    return;
  }

  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(rows);
  const wb: XLSX.WorkBook = XLSX.utils.book_new();

  const currentDate = this.datePipe.transform(new Date(), 'dd/MM/yyyy')!;
  XLSX.utils.book_append_sheet(wb, ws, 'AllTasks');
  XLSX.writeFile(wb, `Charge Out ${currentDate}.xlsx`);
}

  expandedPSL: Set<number> = new Set();
  togglePSL(index: number) {
    if (this.expandedPSL.has(index)) {
      this.expandedPSL.delete(index);
    } else {
      this.expandedPSL.add(index);
    }
  }

  isPSLExpanded(index: number): boolean {
    return this.expandedPSL.has(index);
  }

  button_name = "Expand All"
  expandAll() {
    for (let i = 0; i < this.all_task.length; i++) {
      this.expandedPSL.add(i);
      this.button_name = "Collapse All"
    }
  }

  collapseAll() {
    this.expandedPSL.clear()
    this.button_name = "Expand All"
  }

  expandedTaskMap: Map<number, Set<string>> = new Map();
  toggleTask(pslIndex: number, taskNumber: any) {
    const currentExpanded = this.expandedTaskMap.get(pslIndex);
    if (currentExpanded?.has(taskNumber)) {
      currentExpanded.delete(taskNumber);
      if (currentExpanded.size === 0) {
        this.expandedTaskMap.delete(pslIndex);
      }
    } else {
      if (!this.expandedTaskMap.has(pslIndex)) {
        this.expandedTaskMap.set(pslIndex, new Set());
      }
      this.expandedTaskMap.get(pslIndex)?.add(taskNumber);
    }
  }

  isTaskExpanded(pslIndex: number, taskNumber: any): boolean {
    return this.expandedTaskMap.get(pslIndex)?.has(taskNumber) || false;
  }

  get totalRecords(): number {
    return this.all_task.reduce((sum: any, row: { data: string | any[]; }) => sum + (row.data?.length || 0), 0);
  }

  get totalPSLs(): number {
    return this.all_task.length;
  }

  get grandTotal(): number {
    return this.all_task.reduce((sum: any, row: { data: any[]; }) => {
      const detailsTotal = row.data?.reduce((subtotal, d) => subtotal + (d.cost || 0), 0) || 0;
      return sum + detailsTotal;
    }, 0);
  }

}
