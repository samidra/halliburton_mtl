import { Component, NgZone } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { CommonServiceService } from '../Services/common-service.service';
import { Title } from '@angular/platform-browser';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AllApiServiceService } from '../Services/all-api-service.service';

interface PslRate {
  pslName: string;
  rates: any;
  highlightedMonths?: { [key: string]: boolean };
}

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
  selector: 'app-reportbackup',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './reportbackup.component.html',
  styleUrl: './reportbackup.component.scss',
  providers: [DatePipe]
})
export class ReportbackupComponent {


  all_request: Record<number, Record<string, any[]>> =
    {
      2024: {
        January: [
          {
            testId: 'T001',
            description: 'Test 1',
            startTime: '2025-01-12 08:00 AM',
            endTime: '2025-01-12 10:00 AM',
            hour: 2,
            perHourRate: 50,
            cost: 2024,
            chargeCode: 'CC001',
            actCode: 'AC002',
            resource: 'Resource 1',
            tool: 'Tool A',
            psl: 'PSL001',
            group: 'Group A',
            adjustedCode: 'Adjusted001'
          },
          {
            testId: 'T002',
            description: 'Test 2',
            startTime: '2025-01-12 10:00 AM',
            endTime: '2025-01-12 12:00 PM',
            hour: 2,
            perHourRate: 55,
            cost: 110,
            chargeCode: 'CC002',
            actCode: 'AC002',
            resource: 'Resource 2',
            tool: 'Tool B',
            psl: 'PSL002',
            group: 'Group B',
            adjustedCode: 'Adjusted002'
          },
          {
            testId: 'T003',
            description: 'Test 3',
            startTime: '2025-01-13 08:00 AM',
            endTime: '2025-01-13 10:00 AM',
            hour: 2,
            perHourRate: 60,
            cost: 120,
            chargeCode: 'CC003',
            actCode: 'AC003',
            resource: 'Resource 3',
            tool: 'Tool C',
            psl: 'PSL003',
            group: 'Group C',
            adjustedCode: 'Adjusted003'
          }
        ],
        February: [
          {
            testId: 'T004',
            description: 'Test 4',
            startTime: '2025-02-12 08:00 AM',
            endTime: '2025-02-12 10:00 AM',
            hour: 2,
            perHourRate: 65,
            cost: 130,
            chargeCode: 'CC004',
            actCode: 'AC004',
            resource: 'Resource 4',
            tool: 'Tool D',
            psl: 'PSL004',
            group: 'Group D',
            adjustedCode: 'Adjusted004'
          },
          {
            testId: 'T005',
            description: 'Test 5',
            startTime: '2025-02-12 10:00 AM',
            endTime: '2025-02-12 12:00 PM',
            hour: 2,
            perHourRate: 70,
            cost: 140,
            chargeCode: 'CC005',
            actCode: 'AC005',
            resource: 'Resource 5',
            tool: 'Tool E',
            psl: 'PSL005',
            group: 'Group E',
            adjustedCode: 'Adjusted005'
          },
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 08:00 AM',
            endTime: '2025-02-13 10:00 AM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        March: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        April: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        May: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        June: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        July: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        August: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        September: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        October: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        November: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        December: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
      },
      2025: {
        January: [
          {
            testId: 'T001',
            description: 'Test 1',
            startTime: '2025-01-12 08:00 AM',
            endTime: '2025-01-12 10:00 AM',
            hour: 2,
            perHourRate: 50,
            cost: 100,
            chargeCode: 'CC001',
            actCode: 'AC001',
            resource: 'Resource 1',
            tool: 'Tool A',
            psl: 'PSL001',
            group: 'Group A',
            adjustedCode: 'Adjusted001'
          },
          {
            testId: 'T002',
            description: 'Test 2',
            startTime: '2025-01-12 10:00 AM',
            endTime: '2025-01-12 12:00 PM',
            hour: 2,
            perHourRate: 55,
            cost: 110,
            chargeCode: 'CC002',
            actCode: 'AC002',
            resource: 'Resource 2',
            tool: 'Tool B',
            psl: 'PSL002',
            group: 'Group B',
            adjustedCode: 'Adjusted002'
          },
          {
            testId: 'T003',
            description: 'Test 3',
            startTime: '2025-01-13 08:00 AM',
            endTime: '2025-01-13 10:00 AM',
            hour: 2,
            perHourRate: 60,
            cost: 120,
            chargeCode: 'CC003',
            actCode: 'AC003',
            resource: 'Resource 3',
            tool: 'Tool C',
            psl: 'PSL003',
            group: 'Group C',
            adjustedCode: 'Adjusted003'
          }
        ],
        February: [
          {
            testId: 'T004',
            description: 'Test 4',
            startTime: '2025-02-12 08:00 AM',
            endTime: '2025-02-12 10:00 AM',
            hour: 2,
            perHourRate: 65,
            cost: 130,
            chargeCode: 'CC004',
            actCode: 'AC004',
            resource: 'Resource 4',
            tool: 'Tool D',
            psl: 'PSL004',
            group: 'Group D',
            adjustedCode: 'Adjusted004'
          },
          {
            testId: 'T005',
            description: 'Test 5',
            startTime: '2025-02-12 10:00 AM',
            endTime: '2025-02-12 12:00 PM',
            hour: 2,
            perHourRate: 70,
            cost: 140,
            chargeCode: 'CC005',
            actCode: 'AC005',
            resource: 'Resource 5',
            tool: 'Tool E',
            psl: 'PSL005',
            group: 'Group E',
            adjustedCode: 'Adjusted005'
          },
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 08:00 AM',
            endTime: '2025-02-13 10:00 AM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        March: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        April: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        May: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        June: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        July: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        August: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        September: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        October: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        November: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
        December: [
          {
            testId: 'T006',
            description: 'Test 6',
            startTime: '2025-02-13 10:00 AM',
            endTime: '2025-02-13 12:00 PM',
            hour: 2,
            perHourRate: 75,
            cost: 150,
            chargeCode: 'CC006',
            actCode: 'AC006',
            resource: 'Resource 6',
            tool: 'Tool F',
            psl: 'PSL006',
            group: 'Group F',
            adjustedCode: 'Adjusted006'
          }
        ],
      }
    }

  formattedMonth: string | undefined;
  current_month: any;
  chargeCode_search: any
  Resource_search: any
  Tool_search: any
  psl_search: any
  group_search: any
  filteredRequests: any[] = [];
  startDate: any;
  endDate: any;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  constructor(private titleService: Title,
    private common_service: CommonServiceService,    
    private api_service: AllApiServiceService,
    private ngZone: NgZone,
    private datePipe: DatePipe) {
    this.titleService.setTitle("Report | MTL HALLIBURTON");

    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.toLocaleString('default', { month: 'long' });
    this.current_month = `${this.currentYear}-${this.currentMonth}`
  }

  currentYear: number;
  currentMonth: string;
  ngOnInit(): void {
    this.filterRequestss();
    this.startPolling();
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
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
    this.isLoading = true;
    this.api_service.Get_Charge_Out().subscribe({
      next: (res: any) => {
        console.log(res)
        this.all_task = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching tasks:', err.message);
        this.isLoading = false;
      }
    });
  }

   filterRequestss() {
   this.filteredRequests = this.all_task.map((row: { data: any[]; }) => {
      return {
        ...row,
        details: row.data.filter((detail:any) => {
          return (
            (this.chargeCode_search ? detail.Charge_Code.includes(this.chargeCode_search) : true) &&
            (this.Resource_search ? detail.Resource.includes(this.Resource_search) : true) &&
            (this.Tool_search ? detail.Tools.includes(this.Tool_search) : true) &&
            (this.psl_search ? detail.PSL.includes(this.psl_search) : true)
          );
        })
      };
    });

  this.resetSearchFilters();
}

  filterRequests() {
  const newDate = new Date(this.current_month);
  this.updateFormattedMonth(newDate);

  if (this.all_request[this.currentYear] && this.all_request[this.currentYear][this.currentMonth]) {
    this.filteredRequests = this.rows.map(row => {
      return {
        ...row,
        details: row.details.filter((detail:any) => {
          return (
            (this.chargeCode_search ? detail.Charge_Code.includes(this.chargeCode_search) : true) &&
            (this.Resource_search ? detail.Resource.includes(this.Resource_search) : true) &&
            (this.Tool_search ? detail.Tools.includes(this.Tool_search) : true) &&
            (this.psl_search ? detail.PSL.includes(this.psl_search) : true)
          );
        })
      };
    });
  } else {
    this.filteredRequests = [];
  }

  this.resetSearchFilters();
}

resetSearchFilters() {
  this.chargeCode_search = '';
  this.Resource_search = '';
  this.Tool_search = '';
  this.psl_search = '';
  this.group_search = '';
  this.startDate = '';
  this.endDate = '';
}


  onMonthChange(event: any) {
    const selectedDate = new Date(event);
    console.log(event)
    this.updateFormattedMonth(selectedDate);
    this.input_class = 'month_input_hide';
    this.currentYear = selectedDate.getFullYear();
    this.currentMonth = selectedDate.toLocaleString('default', { month: 'long' });
    this.filterRequests();
  }

  input_class = 'month_input_hide'
  openDatePicker() {
    this.input_class = this.input_class === 'month_input_hide' ? 'month_inpur_show' : 'month_input_hide'
  }

  updateFormattedMonth(date: Date) {
    this.formattedMonth = this.datePipe.transform(date, 'MMMM yyyy') || '';
  }

  exportToExcel(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredRequests);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Generate Excel file and trigger download
    const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'Report Data.xlsx');
  }

  advance_filter() {

  this.all_task = this.rows.map(row => {
    let filteredDetails = row.details;

    if (this.chargeCode_search) {
      filteredDetails = filteredDetails.filter((test) =>
        test.Charge_Code.toLowerCase().includes(this.chargeCode_search.toLowerCase())
      );
      this.expandedIndexes = this.rows
      .map((row, index) => row.details.some(detail => 
        detail.Charge_Code.toLowerCase().includes(this.chargeCode_search.toLowerCase())) ? index : -1)
      .filter(index => index !== -1);
    }

    if (this.Resource_search) {
      filteredDetails = filteredDetails.filter((test) =>
        test.Resource.toLowerCase().includes(this.Resource_search.toLowerCase())
      );
      this.expandedIndexes = this.rows
      .map((row, index) => row.details.some(detail => 
        detail.Resource.toLowerCase().includes(this.Resource_search.toLowerCase())) ? index : -1)
      .filter(index => index !== -1);
    }

    if (this.Tool_search) {
      filteredDetails = filteredDetails.filter((test) =>
        test.Tools.toLowerCase().includes(this.Tool_search.toLowerCase())
      );
      this.expandedIndexes = this.rows
      .map((row, index) => row.details.some(detail => 
        detail.Tools.toLowerCase().includes(this.Tool_search.toLowerCase())) ? index : -1)
      .filter(index => index !== -1);
    }

    if (this.psl_search) {
      filteredDetails = filteredDetails.filter((test) =>
        test.PSL.toLowerCase().includes(this.psl_search.toLowerCase())
      );
      this.expandedIndexes = this.rows
      .map((row, index) => row.details.some(detail => 
        detail.PSL.toLowerCase().includes(this.psl_search.toLowerCase())) ? index : -1)
      .filter(index => index !== -1);
    }

    if (this.group_search) {
      filteredDetails = filteredDetails.filter((test) =>
        test.Group.toLowerCase().includes(this.group_search.toLowerCase())
      );
      this.expandedIndexes = this.rows
      .map((row, index) => row.details.some(detail => 
        detail.Group.toLowerCase().includes(this.group_search.toLowerCase())) ? index : -1)
      .filter(index => index !== -1);
    }

    // Return the row with the filtered details
    return {
      ...row,
      details: filteredDetails, 
    };
  });

  this.rows = [...this.rows];
  }
 
  // Event Handlers
  chargeCode_search_filter(event: any) {
    this.chargeCode_search = event.target.value;
    this.advance_filter()
  }

  resource_search_filter(event: any) {
    this.Resource_search = event.target.value;
    this.advance_filter();
  }

  tool_search_filter(event: any) {
    this.Tool_search = event.target.value;
    this.advance_filter();
  }

  psl_search_filter(event: any) {
    this.psl_search = event.target.value;
    this.advance_filter();
  }

  group_search_filter(event: any) {
    this.group_search = event.target.value;
    this.advance_filter();
  }

  filterData(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let filteredResults: any[] = [];

    for (const year in this.all_request) {
      for (const month in this.all_request[year]) {
        const records = this.all_request[year][month];

        const filtered = records.filter(record => {
          const recordDate = new Date(record.startTime);
          return recordDate >= start && recordDate <= end;
        });

        filteredResults = [...filteredResults, ...filtered];
      }
    }
    this.filteredRequests = filteredResults;
  }

  searchRecords() {
    if (this.startDate && this.endDate) {
      this.filterData(this.startDate, this.endDate);
    } else {
      this.common_service.displayWarning('Please select both start and end dates.')
    }
  }

  expandedIndexes: number[] = [];
  table_headers = [
    { key: 'psl', label: 'PSL' },
    { key: 'group', label: 'Group' },
    { key: 'tool', label: 'Tools' },
    { key: 'resource', label: 'Resource' },
    { key: 'taskNumber', label: 'Test ID' },
    { key: 'description', label: 'Description' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    { key: 'hour', label: 'Hours' },
    { key: 'perHourRate', label: 'Per Hour Rate' },
    { key: 'cost', label: 'Total Cost' },
    { key: 'charge_Code', label: 'Charge Code' },
    { key: 'activity_Code', label: 'Activity Code' },
  ]

  rows: Row[] = [
  ];

  toggleRow(index: number) {
    const pos = this.expandedIndexes.indexOf(index);
    if (pos > -1) {
      this.expandedIndexes.splice(pos, 1);
    } else {
      this.expandedIndexes.push(index);
      this.button_name = "Collapse All"
    }
  }

  isExpanded(index: number): boolean {
    return this.expandedIndexes.includes(index);
  }

  getRowValue(row: Row | RowDetails, key: string): string | number {
    return row[key as keyof typeof row] ?? '-';
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
      for (let i = 0; i < this.rows.length; i++) {
        this.expandedIndexes.push(i);
        this.button_name = "Collapse All"
      }
    }
  }

  collapseAll() {
    this.expandedIndexes = [];
    this.button_name = "Expand All"
  }
}

