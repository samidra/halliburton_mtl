import { Component, NgZone } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AllApiServiceService } from '../Services/all-api-service.service';
import { Router } from '@angular/router';
import { CommonServiceService } from '../Services/common-service.service';

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
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  constructor(private titleService: Title,
    private api_service: AllApiServiceService,
    private commonService:CommonServiceService,
    private datePipe: DatePipe,
    private router: Router,
    private ngZone: NgZone) {
    this.titleService.setTitle("Report | MTL HALLIBURTON");
  }

  ngOnInit(): void {
    this.startPolling();
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  filterOptionList: any = ['Charge Code', 'Resource', 'Tool', 'Group',]
  selectedFilterValue: any = 'Select Filter Option'
  expandedIndexes: number[] = [];
  getfilterselectedOption(event: any) {
    this.selectedFilterValue = event.target.value;
    console.log('Selected filter option:', this.selectedFilterValue);
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
  Get_Charge_Out() {
    this.api_service.Get_Charge_Out().subscribe({
      next: (res: any) => {
        this.all_task = res;
        this.filteredTasks = this.all_task;
        this.taskList = this.all_task.flatMap((task: any) => {
          return task.data.flatMap((taskData: any) => {
            return taskData.taskNumbers.flatMap((item: any[]) => item);
          })
        });
        // console.log('All Tasks Data:', this.taskList);
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

  this.filteredTasks = this.all_task.flatMap((task: any) =>
    task.data
      .map((dataItem: any) => {
        const filteredTaskNumbers = dataItem.taskNumbers.filter((task: any) => {
          console.log('Checking task dates:', task);
          console.log('Checking task dates:', task.startDate, task.endDate);
          const taskStart: any = this.datePipe.transform(task.startDate?.split("T")[0], 'yyyy-MM-dd');
          const taskEnd: any = this.datePipe.transform(task.endDate?.split("T")[0], 'yyyy-MM-dd');
          const isOverlapping = (taskStart <= end) && (taskEnd >= start);
          return isOverlapping;
        });
        return {
          ...dataItem,
          taskNumbers: filteredTaskNumbers
        };
      })
      .filter((dataItem: any) => dataItem.taskNumbers.length > 0)
  ).filter((task: any) => task.data.length > 0);

  console.log('Filtered tasks by date range:', this.filteredTasks);

  // this.expandedIndexes = this.filteredTasks.map((task: any, index: number) => {
  //   this.button_name = "Collapse All";
  //   return index;
  // });
}

  filteredTasks: any = []
  filteredAutocomplete() {
   
    if (!this.chargeCode_search && !this.Resource_search && !this.Tool_search && !this.group_search) {
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
                          this.selectedFilterValue === 'Resource' ? this.Resource_search:
                          this.selectedFilterValue === 'Tool' ? this.Tool_search:
                          this.selectedFilterValue === 'Group' ? this.group_search: '';
                          // this.selectedFilterValue === 'PSL' ? this.Tool_search: '';

      const fieldName = this.selectedFilterValue === 'Charge Code' ? 'charge_Code' : 
                        this.selectedFilterValue === 'Resource'? 'resource':
                        this.selectedFilterValue === 'Tool'? 'tool':
                        this.selectedFilterValue === 'Group'? 'group':'group';
                        // this.selectedFilterValue === 'Tool'? 'tool':'tool';

      console.log('Filtering by', fieldName, 'with value:', searchValue);
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
      if(this.filteredTasks.length === 0){
                this.button_name = "Expand All"
              }
      this.updateExpandedTasks(fieldName, searchValue);
    }
  }

  updateExpandedTasks(fieldName: string, searchValue: string) {
    this.filteredTasks.forEach((pslItem: { data: any[]; }, pslIndex: number) => {
      pslItem.data.forEach((dataItem: { taskNumbers: any[]; }) => {
        dataItem.taskNumbers.forEach((taskArray: any[]) => {
          taskArray.forEach((task: { [x: string]: string; taskNumber: string; }) => {
            if (task[fieldName].toLowerCase().includes(searchValue.toLowerCase())) {
              this.expandedPSL.add(pslIndex);
              this.expandedTaskMap.set(pslIndex, task.taskNumber);
              if(this.filteredTasks.length !== 0){
                this.button_name = "Collapse All"
              }
            }
          });
        });
      });
    });
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
    this.startPolling();
  }

  routetoTaskInterface(value: any): void {
    const taskNumber = value;
    if (taskNumber) {
      this.router.navigate([`tech-interface/${taskNumber}`]);
    }
  }

  exportToExcel(): void {
    const rows: any[] = [];
    this.all_task.forEach((pslItem: any) => {

      return pslItem.data.forEach((dataItem: any) => {

        return dataItem.taskNumbers.forEach((item: any[]) => {

          item.forEach((task: any) => {
            rows.push({
              PSL: task.psl,
              TaskNumber: task.taskNumber,
              Description: task.description,
              StartDate: task.startDate,
              EndDate: task.endDate,
              Hours: task.hour,
              PerHourRate: task.perHourRate,
              Cost: task.cost,
              ChargeCode: task.charge_Code,
              ActivityCode: task.activity_Code,
              Resource: task.resource,
              Tool: task.tool,
              Group: task.group
            });
          })
        })

      });
    });

    if (rows.length === 0) {
      alert('No tasks available to download.');
      return;
    }

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(rows);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, 'AllTasks');

    XLSX.writeFile(wb, 'AllTasks.xlsx');
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

  expandedTaskMap: Map<number, string> = new Map();
  toggleTask(pslIndex: number, taskNumber: any) {
    const currentExpanded = this.expandedTaskMap.get(pslIndex);
    if (currentExpanded === taskNumber) {
      this.expandedTaskMap.delete(pslIndex);
    } else {
      this.expandedTaskMap.set(pslIndex, taskNumber);
    }
  }

  isTaskExpanded(pslIndex: number, taskNumber: any): boolean {
    return this.expandedTaskMap.get(pslIndex) === taskNumber;
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
