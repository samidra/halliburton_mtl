import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, NgZone, ViewChild, viewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { CommonServiceService } from '../Services/common-service.service';
import { AllApiServiceService } from '../Services/all-api-service.service';
import { LocalStorageService } from '../Services/local-storage.service';
interface WorkRequest {
  requester: string;
  request_Number: string;
  psl: string;
  charge_Code: string;
  status: string;
}


@Component({
  selector: 'app-work-request-form',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxPaginationModule,],
  templateUrl: './work-request-form.component.html',
  styleUrl: './work-request-form.component.scss'
})



export class WorkRequestFormComponent {
  itemsPerPage: number = 25;
  page = 1;
  work_request_type = "Search by work request number"
  filtered_all_requestor: any[] = [];
  filtered_request_no: any;
  filtered_task_Number: any;
  filtered_chargeCode: any;
  filtered_psl: any;
  filtered_status: any;

  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef;
  @ViewChild('inputField') inputField!: ElementRef;
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {
    if (!this.inputField || !this.dropdownContainer) {
      return;
    }

    const clickedInsideInput = this.inputField.nativeElement.contains(event.target);
    const clickedInsideDropdown = this.dropdownContainer.nativeElement.contains(event.target);

    if (!clickedInsideInput && !clickedInsideDropdown) {
      this.showlistrequester = false;
      this.showlistrequest_Number = false;
      this.showlisttask_Number = false;
      this.showlistcharge_Code = false;
      this.showlistpsl = false;
      this.showliststatus = false;
    }
  }

  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  filter = {
    charge_Code: '',
    psl: '',
    request_Number: '',
    task_Number: '',
    requester: '',
    status: ''
  };

  filteredData: any[] = [];

  constructor(
    private titleService: Title,
    private ngZone: NgZone,
    private api_service: AllApiServiceService,
  ) {
    this.isLoading = true;
  }

  ngOnInit(): void {
    this.titleService.setTitle('All Work Request | MTL HALLIBURTON');
    this.startPolling();
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Component destroyed. Polling stopped.');
    }
  }

  shouldPollData(): boolean {
    // If any filter has a value, stop polling
    return !Object.values(this.filter).some(value => value !== '');
  }

  startPolling() {
    if (this.shouldPollData()) {
      this.get_all_work_request_list();

      this.ngZone.runOutsideAngular(() => {
        this.pollingInterval = setInterval(() => {
          this.ngZone.run(() => {
            if (this.shouldPollData()) {
              this.get_all_work_request_list();
            } else {
              clearInterval(this.pollingInterval!);
              this.pollingInterval = null; // Stop polling
              console.log('Polling stopped as filters are active.');
            }
          });
        }, 5000);
      });
    }
  }

  allDataRes: any = [];
  isLoading: boolean = true;
  get_all_work_request_list() {
    this.api_service.get_all_workrequest().subscribe((res) => {
      this.isLoading = false;
      this.allDataRes = res;
      console.log(res)
      this.allDataRes = this.allDataRes.sort((a: { request_Number: string; }, b: { request_Number: string; }) => {
        const numA = parseInt(a.request_Number.replace(/\D/g, ''), 10);
        const numB = parseInt(b.request_Number.replace(/\D/g, ''), 10);
        return numA - numB;
      });
      this.filtered_all_requestor = [...new Set(this.allDataRes.map((item: { requester: any; }) => item.requester))];
      this.filtered_request_no = [...new Set(this.allDataRes.map((item: { request_Number: any; }) => item.request_Number))];
      this.filtered_task_Number = [...new Set(this.allDataRes.map((item: { task_Number: any; }) => item.task_Number))];
      this.filtered_chargeCode = [...new Set(this.allDataRes.map((item: { charge_Code: any; }) => item.charge_Code))];
      this.filtered_psl = [...new Set(this.allDataRes.map((item: { psl: any; }) => item.psl))];
      this.filtered_status = [...new Set(this.allDataRes.map((item: { status: any; }) => item.status))];
      this.filteredData = [...this.allDataRes];
    });
  }

  filterData(field: any, value: any): void {
    const optionKeys = [
      'showlistrequester',
      'showlistrequest_Number',
      'showlisttask_Number',
      'showlistcharge_Code',
      'showlistpsl',
      'showliststatus',
    ];

    optionKeys.forEach((key: any) => {
      const field = `${key}` as keyof this;
      (this as any)[field] = false;
    });

    (this as any).filter[field] = value;
    this.filteredData = this.allDataRes.filter((item:
      { request_Number: string; task_Number: string; psl: string; charge_Code: string; requester: string; status: string; }) => {

      return (
        (this.filter.charge_Code === '' || item.charge_Code === this.filter.charge_Code) &&
        (this.filter.psl === '' || item.psl === this.filter.psl) &&
        (this.filter.request_Number === '' || item.request_Number === this.filter.request_Number) &&
        (this.filter.task_Number === '' || item.task_Number === this.filter.task_Number) &&
        (this.filter.requester === '' || item.requester === this.filter.requester) &&
        (this.filter.status === '' || item.status === this.filter.status)
      );
    });

    if (this.shouldPollData()) {
      this.startPolling();  // Restart polling if filters are cleared
    } else {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval!);  // Stop polling when any filter has a value
        this.pollingInterval = null;
        console.log('Polling stopped due to active filters.');
      }
    }
  }

  showlistrequester: any = false;
  showlistrequest_Number: any = false;
  showlisttask_Number: any = false;
  showlistcharge_Code: any = false;
  showlistpsl: any = false;
  showliststatus: boolean = false;

  show(value: string): void {
    const optionKeys = [
      'showlistrequester',
      'showlistrequest_Number',
      'showlisttask_Number',
      'showlistcharge_Code',
      'showlistpsl',
      'showliststatus',
    ];

    optionKeys.forEach((key: any) => {
      const field = `${key}` as keyof this;
      (this as any)[field] = false;
    });

    (this as any)[`showlist${value}`] = true;
    const field = value as keyof this;
    (this as any)[field] = [...new Set(this.allDataRes.map((item: { value: any; }) => item.value))];
  }

  filteredAutocomplete(field: keyof this, filterKey: keyof typeof this.filter): void {
    const searchTerm = this.filter[filterKey]?.trim().toLowerCase() || '';
    if (searchTerm === '') {
      this.filteredData = [...this.allDataRes];

      this.startPolling();
    } else {
      const fullList = [...new Set(this.allDataRes.map((item: any) => item[filterKey]))];
      (this as any)[field] = fullList.filter((item: any) => item?.toLowerCase().includes(searchTerm));

      if (this.pollingInterval) {
        clearInterval(this.pollingInterval!);
        this.pollingInterval = null;
        console.log('Polling stopped due to active filters.');
      }
    }
  }


  remove_filter() {
    this.filteredData = [...this.allDataRes];
    this.filter = {
      charge_Code: '',
      psl: '',
      request_Number: '',
      task_Number: '',
      requester: '',
      status: ''
    };

    this.startPolling();
  }

  view_all_detail(work_request_no: any) {
    window.open(`work-request/detail/${work_request_no}`, '_blank');
  }

  get_task_details(work_request_no: any, task_Number: any) {
    const url = `task-request/detail/${work_request_no}/${task_Number}`;
    window.open(url, '_blank');
  }
}

