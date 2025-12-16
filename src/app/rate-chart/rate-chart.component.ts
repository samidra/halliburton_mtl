import { Component, ElementRef, HostListener, Inject, NgZone, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgxPaginationModule } from 'ngx-pagination';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog"
import { CommonServiceService } from '../Services/common-service.service';
import { Title } from '@angular/platform-browser';
import { AllApiServiceService } from '../Services/all-api-service.service';

// interface PslRate {
//   resource: string;
//   // rates: any;
//   highlightedMonths?: { [key: string]: boolean };
// }

@Component({
  selector: 'app-rate-chart',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxPaginationModule],
  templateUrl: './rate-chart.component.html',
  styleUrl: './rate-chart.component.scss'
})
export class RateChartComponent {

  new_work_request !: FormGroup;
  currentYear: number = new Date().getFullYear();
  currentYeara: number = new Date().getFullYear();
  searchText = "";
  monthsNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'
  ];

  isDragging: boolean = false;
  draggedValue: any;
  selectedPslIndex: number | null = null;
  startMonthIndex: number | null = null;
  page = 1;
  itemsPerPage: number = 25;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  
  constructor(private titleService: Title,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private common_service: CommonServiceService,
    private api_service: AllApiServiceService,
    private ngZone: NgZone) {
    this.titleService.setTitle("Rate Chart | MTL HALLIBURTON");
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

  startPolling() {
    this.Get_all_rateChart_rate()
    this.ngZone.runOutsideAngular(() => {
      this.pollingInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.Get_all_rateChart_rate()
        })
      }, 5000)
    })
  }

  isLoading: boolean = true;
  rate_chart_list: any;
  Get_all_rateChart_rate() {
    this.api_service.Get_all_rateChart_rate(this.currentYear).subscribe({
      next: (res: any) => {
        this.rate_chart_list = res;
        this.rate_chart_list = this.rate_chart_list.flatMap((item: any) => item.rates)
        console.log(this.rate_chart_list)
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching:', err.message);
        this.isLoading = false;
      }
    });
  }

  no_data_message = 'No data found';
  get filteredItems() {
    if (!this.searchText) {
      return this.rate_chart_list;
    }

    const search = this.searchText.toLowerCase();
    const filtered = this.rate_chart_list.filter((item: any) =>
      Object.values(item).some((value: any) => {
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(search);
      })
    );

    // Check if the filtered array is empty
    if (filtered.length === 0) {
      this.no_data_message = 'No results found for this search.'
    }

    return filtered; // Return filtered data if any
  }

  previousYear(): void {
    this.isLoading = true;
    this.currentYear = this.currentYear - 1
    this.Get_all_rateChart_rate()
  }

  nextYear(year: any): void {
    this.isLoading = true;
    const currentYear = new Date().getFullYear()
    if (currentYear > year) {
      this.currentYear = this.currentYear + 1
      this.Get_all_rateChart_rate()
    } else {
      this.common_service.displayWarning(`We didn't have any data for the year ${this.currentYear + 1}.`)
    }

  }

  Is_spinner_save: number | null = null;
  updateRate(item: any, index: any): void {
    this.Is_spinner_save = index;
    const body = {
      "resource": item.resource,
      "year": Number(item.year),
      "january": Number(item.january),
      "february": Number(item.february),
      "march": Number(item.march),
      "april": Number(item.april),
      "may": Number(item.may),
      "june": Number(item.june),
      "july": Number(item.july),
      "august": Number(item.august),
      "september": Number(item.september),
      "october": Number(item.october),
      "november": Number(item.november),
      "december": Number(item.december),
      "userID": 'H317697'
    }

    console.log(body)
    this.api_service.update_resource_rateChart(body).subscribe({
      next: (res) => {
        this.isLoading = true
        this.common_service.displaySuccess(`Rate Updated Sucessfully`);
        this.Is_spinner_save = null
        this.startPolling()
      }, error: (err) => {
        console.error('Error fetching:', err.message);
        this.Is_spinner_save = null
      }
    })

  }

  Is_spinner: boolean = false;
  addNewResource(): void {
    this.Is_spinner = true
    this.api_service.Get_all_resource_rateChart().subscribe({
      next: (res: any) => {
        this.Is_spinner = false
        const dialogRef = this.dialog.open(add_new_resource, {
          data: { res: res },
          width: '400px',
          // height: '320px',
          panelClass: 'custom-dialog-container'
        })
        dialogRef.afterClosed().subscribe(result => {
          this.Is_spinner = false
          this.isLoading = true
          this.startPolling()
        });
      },
      error: (err) => {
        console.error('Error fetching:', err.message);
      }
    })
  }

  startDrag(Index: number, month: string, monthIndex: number): void {
    if (this.currentYear === this.currentYeara) {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval!);
        this.pollingInterval = null;
        console.log('Polling stopped due to active filters.');
      }

      this.isDragging = true;
      this.selectedPslIndex = Index;
      this.startMonthIndex = monthIndex;
      this.draggedValue = this.rate_chart_list[Index][month.toLowerCase()];
      this.rate_chart_list[Index].highlightedMonths = {};
      this.rate_chart_list[Index].highlightedMonths[month] = true;
    }
  }

  applyDrag(Index: number, month: string, monthIndex: number): void {
    if (this.currentYear === this.currentYeara) {
      if (this.isDragging && this.selectedPslIndex === Index && this.startMonthIndex !== null) {
        this.rate_chart_list[Index][month.toLowerCase()] = this.draggedValue;
      }
    }
  }

  stopDrag(Index: number, month: string,): void {
    if (this.currentYear === this.currentYeara) {
      this.isDragging = false;
      this.selectedPslIndex = null;
      this.startMonthIndex = null;
      this.rate_chart_list[Index].highlightedMonths = {};
      this.rate_chart_list[Index].highlightedMonths[month] = false;
      // this.common_service.displayWarning(`Make sure to click 'Save Price' to updated the rate`)
    }
  }
}

@Component({
  selector: 'add_new_resource',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
  <div class="container-fluid common_dialog modify " #modalContainer>
  <div class="row">
    <div class="col-12">
      <h2>Add Resource</h2>

      <form class="mt-1">
        <div class="form-group">
          <div class="form_field">
            <label for="resources">Resources: </label>
            <div class="form_field_dropdown" style="width: 100%;">
              <input id="resources" type="text" class="form-control" placeholder="Search resources here"
                [(ngModel)]="resource_name" [ngModelOptions]="{standalone: true}"
                (ngModelChange)="filteredAutocomplete()" (click)="show()" #inputField>
              <ul *ngIf="resourcesOptions?.length !=0" class="list_drop" #dropdownContainer>
                <li *ngFor="let option of resourcesOptions" (click)="selectOption(option)">
                  {{option}}
                </li>
              </ul>
            </div>
          </div>

        </div>
        <div class="btn_div">
          <button class="yesbtn" (click)="add_new_resource()" *ngIf="!Is_spinner">Add Resource</button>
          <button type="button" class="yesbtn" *ngIf="Is_spinner">
                        <div class="spinner"></div>
                    </button>
          <button (click)="close()">Cancel</button>
        </div>
      </form>

    </div>
  </div>
</div>
  `,
  styleUrl: './rate-chart.component.scss'
})

export class add_new_resource {
  resource_name = ''
  res: any

  resourcesOptions: string[] = [];
  @ViewChild('modalContainer', { static: false }) modalContainer!: ElementRef;
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
      this.resourcesOptions = [];
      this.modalContainer.nativeElement.style.height = '150px';
    }
  }
  constructor(public dialogRef: MatDialogRef<add_new_resource>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private api_service: AllApiServiceService,
    private common_service: CommonServiceService) {
    this.res = data.res
  }

  show() {
    this.resourcesOptions = this.res.map((item: any) => item.shortDescription)
    if (this.modalContainer) {
      this.modalContainer.nativeElement.style.height = '350px';
    }
  }

  filteredAutocomplete() {
    this.resourcesOptions = this.res
      .map((item: any) => item.shortDescription)
      .filter((item: string) => item.toLowerCase().includes(this.resource_name.toLowerCase()));
  }

  selectOption(option: string): void {
    this.resource_name = option
    this.resourcesOptions = [];
    this.modalContainer.nativeElement.style.height = '150px';
  }

  close() {
    this.dialogRef.close()
  }

  Is_spinner: boolean = false;
  add_new_resource(): void {
    if (this.resource_name != '') {
      this.Is_spinner = true
      const body = {
        resource: this.resource_name,
        year: new Date().getFullYear(),
        userID: 'H317697'
      }

      this.api_service.Add_resource_rateChart(body).subscribe({
        next: (res) => {
          console.log(res)
          this.common_service.displaySuccess('The resource has been added successfully. ');
          this.dialogRef.close()
          this.Is_spinner = false
        },
        error: (err) => {
          console.error('Error fetching:', err.message);
          this.Is_spinner = false
        }
      })

    } else {
      this.common_service.displayWarning('Please provide the resource first.');
    }
  }
}