import { Component, NgZone } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Title } from '@angular/platform-browser';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AllApiServiceService } from '../Services/all-api-service.service';
import { Router } from '@angular/router';

interface RowDetails {
  PSL: string;
  Group: string;
  Tools: string;
  Resource: string;
  Test_ID: string;
  Description: string;
  Start_Date: string;
  End_Date: string;
  Hours: any;
  Per_Hour_Rate: any;
  Total_Cost: any;
  Charge_Code: string;
  Activity_Code: string;
}

interface Row {
  psl: string;
  totalHours: any;
  totalCosts: any;
  details: RowDetails[];

  [key: string]: string | number | RowDetails[] | undefined;
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

  filterOptionList: any = ['Charge Code', 'Resource', 'Tool', 'PSL', 'Group',]
  selectedFilterValue: any = 'Select Filter Option'
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
  all_task: any = []
  Get_Charge_Out() {

    this.api_service.Get_Charge_Out().subscribe({
      next: (res: any) => {
        this.all_task = res;
        console.log(this.all_task)
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

  filterByDateRange() {

    if (!Array.isArray(this.all_task) || this.all_task.length === 0) {
      console.error('all_task is not initialized or is empty');
      this.filteredTasks = [];
      this.expandedIndexes = [];
      return;
    }
    const start: any = this.datePipe.transform(this.startDate, 'yyyy-MM-dd');
    const end: any = this.datePipe.transform(this.endDate, 'yyyy-MM-dd');
    if (start > end) {
      console.error('Start date cannot be later than end date.');
      return;
    }

    this.filteredTasks = this.all_task.flatMap((task: any) =>
      task.data.filter((item: any) => {
        const taskStart: any = this.datePipe.transform(item.startDate, 'yyyy-MM-dd');
        const taskEnd: any = this.datePipe.transform(item.endDate, 'yyyy-MM-dd');

        const isOverlapping = (taskStart <= end) && (taskEnd >= start);

        return isOverlapping;
      })
    );

    console.log('Filtered tasks by date range:', this.filteredTasks);

    this.expandedIndexes = this.filteredTasks
      .map((task: any, index: number) => {
        this.button_name = "Collapse All";
        return index;
      });
  }

  filteredTasks: any[] = [];
  filteredAutocomplete() {
    if (!Array.isArray(this.all_task) || this.all_task.length === 0) {
      console.error('all_task is not initialized or is empty');
      this.filteredTasks = [];
      this.expandedIndexes = [];
      return;
    }
    this.filteredTasks = this.all_task.flatMap((task: any) =>
      task.data.filter((item: any) => {
        let matchesChargeCode = true;
        let matchesResource = true;
        let matchesTool = true;
        let matchesPSL = true;
        let matchesGroup = true;

        // Charge Code filtering (case insensitive)
        if (this.chargeCode_search.trim() !== '') {
          matchesChargeCode = item.charge_Code && item.charge_Code.toLowerCase().includes(this.chargeCode_search.toLowerCase());
        }
        if (this.Resource_search.trim() !== '') {
          matchesResource = item.resource && item.resource.toLowerCase().includes(this.Resource_search.toLowerCase());
        }
        if (this.Tool_search.trim() !== '') {
          matchesTool = item.tool && item.tool.toLowerCase().includes(this.Tool_search.toLowerCase());
        }
        if (this.psl_search.trim() !== '') {
          matchesPSL = item.psl && item.psl.toLowerCase().includes(this.psl_search.toLowerCase());
        }
        if (this.group_search.trim() !== '') {
          matchesGroup = item.group && item.group.toLowerCase().includes(this.group_search.toLowerCase());
        }
        if (this.pollingInterval) {
          clearInterval(this.pollingInterval!);
          this.pollingInterval = null;
          console.log('Polling stopped due to active filters.');
        }

        return matchesChargeCode && matchesResource && matchesTool && matchesPSL && matchesGroup;
      })
    );

    console.log('Filtered tasks:', this.filteredTasks);
    this.expandedIndexes = this.filteredTasks
      .map((task: any, index: number) => {
        this.button_name = "Collapse All"
        return index;
      });
  }

  getFilteredDetails(row: any): any[] {
    if (!row?.data) return [];

    return row.data.filter((item: any) => {
      let matchesChargeCode = true;
      let matchesResource = true;
      let matchesTool = true;
      let matchesPSL = true;
      let matchesGroup = true;

      if (this.chargeCode_search.trim() !== '') {
        matchesChargeCode = item.charge_Code?.toLowerCase().includes(this.chargeCode_search.toLowerCase());
      }
      if (this.Resource_search.trim() !== '') {
        matchesResource = item.resource?.toLowerCase().includes(this.Resource_search.toLowerCase());
      }
      if (this.Tool_search.trim() !== '') {
        matchesTool = item.tool?.toLowerCase().includes(this.Tool_search.toLowerCase());
      }
      if (this.psl_search.trim() !== '') {
        matchesPSL = item.psl?.toLowerCase().includes(this.psl_search.toLowerCase());
      }
      if (this.group_search.trim() !== '') {
        matchesGroup = item.group?.toLowerCase().includes(this.group_search.toLowerCase());
      }

      return matchesChargeCode && matchesResource && matchesTool && matchesPSL && matchesGroup;
    });
  }

  remove_filter() {
    this.selectedFilterValue = 'Select Filter Option'
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

  expandedIndexes: number[] = [];
  table_headers = [
    { key: 'psl', label: 'PSL' },
    { key: 'taskNumber', label: 'Test ID' },
    { key: 'group', label: 'Group' },
    { key: 'resource', label: 'Resource' },
    { key: 'tool', label: 'Tools' },
    { key: 'description', label: 'Description' },
    { key: 'charge_Code', label: 'Charge Code' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    { key: 'perHourRate', label: 'Per Hour Rate' },
    { key: 'hour', label: 'Total Hours' },
    { key: 'cost', label: 'Total Cost' },
    { key: 'activity_Code', label: 'Activity Code' },
  ]

  toggleRow(index: number) {
    const pos = this.expandedIndexes.indexOf(index);
    // this.expandedIndexes = [];
    this.filteredTasks = [];
    if (pos > -1) {
      this.expandedIndexes.splice(pos, 1);
      this.button_name = "Expand All"
    } else {
      this.expandedIndexes.push(index);
      this.filteredTasks = this.all_task[index].data
      this.button_name = "Collapse All"
    }
  }

  isExpanded(index: number): boolean {
    return this.expandedIndexes.includes(index);
  }

  getRowValue(row: Row | RowDetails, key: string): any {
    const value = row[key as keyof typeof row];
    if (key === 'startDate' || key === 'endDate') {
      return this.datePipe.transform(value, 'yyyy-MM-dd') ?? '-';
    }
    return value ?? '-';
  }

  routetoTaskInterface(value: any): void {
    const taskNumber = value;
    if (taskNumber) {
      this.router.navigate([`tech-interface/${taskNumber}`]);
    }
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

  button_name = "Expand All"
  expandAll() {
    if (this.expandedIndexes.length === 0) {
      for (let i = 0; i < this.all_task.length; i++) {
        this.expandedIndexes.push(i);
        this.button_name = "Collapse All"
      }
    }
  }

  collapseAll() {
    this.expandedIndexes = [];
    this.button_name = "Expand All"
  }

  exportToExcel(): void {

    this.filteredTasks = this.all_task.flatMap((task: any) => {
      return task.data.filter((item: any) => {
        return item.subtasks || item;
      });
    });
    if (this.filteredTasks.length === 0) {
      alert('No tasks available to download.');
      return;
    }
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredTasks);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AllTasks');
    XLSX.writeFile(wb, 'AllTasks.xlsx');
  }
}
