import { Component, Inject, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms'
import { NgxPaginationModule } from 'ngx-pagination';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommonServiceService } from '../Services/common-service.service';
import { AllApiServiceService } from '../Services/all-api-service.service';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-tech-interface',
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './tech-interface.component.html',
  styleUrl: './tech-interface.component.scss'
})
export class TechInterfaceComponent implements OnInit, OnDestroy {
  page = 1;
  itemsPerPage: number = 25;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  searchText = "";
  constructor(
    private titleService: Title,
    private commonService: CommonServiceService,
    private api_service: AllApiServiceService,
    private ngZone: NgZone,
    private route: ActivatedRoute,
    public dialog: MatDialog) {
    this.titleService.setTitle('Tech Interface | MTL HALLIBURTON');
  }
  taskNumber: string | null = null;
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.taskNumber = params.get('taskNumber');
      if (this.taskNumber) {
        this.searchText = this.taskNumber;
      }
    });
    this.startPolling();
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  startPolling() {
    this.get_all_task_request();
    this.ngZone.runOutsideAngular(() => {
      this.pollingInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.get_all_task_request();
        });
      }, 5000);
    });
  }

  get_all_task_request() {

    this.api_service.get_all_task_request().subscribe({
      next: (res: any) => {
        this.all_task = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching tasks:', err.message);
        this.isLoading = false;
      }
    });
  }

  all_task: any = []
  isLoading: boolean = true;
  get filteredItems() {
    if (!this.searchText) {
      return this.all_task; // Show all data initially
    }

    const search = this.searchText.toLowerCase();

    return this.all_task.filter((item: any) =>
      Object.values(item).some((value: any) => {
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(search);
      })
    );
  }

  view_all_detail(test_id: any) {
    window.open(`tech-interface/test-detail/${test_id}`, '_blank')
  }

  select_task(request: any) {
    if (this.selectedRequests.length && this.selectedRequests[0].id === request.id) {
      this.selectedRequests = [];
      this.searchText = '';
      this.tasklist_byTaskID = []
      this.selectedRequestsActivity = []
    } else {
      this.selectedRequests = [request];
      this.searchText = request.taskID;
      this.get_task_list_byTaskNumber(request.taskID);
    }
  }

  selectedRequests: any[] = [];
  toggleSelection(request: any, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedRequests = [request];
    } else {
      this.selectedRequests = this.selectedRequests.filter(r => r.taskID !== request.taskID);
    }
  }

  isSelected(request: any): boolean {
    return this.selectedRequests.some(r => r.taskID === request.taskID);
  }

  tasklist_byTaskID: any = []
  get_task_list_byTaskNumber(taskID: any) {
    this.isLoading = true;
    this.api_service.get_task_list_byTaskNumber(taskID).subscribe({
      next: (res: any) => {
        this.tasklist_byTaskID = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching tasks:', err.message);
        this.isLoading = false;
      }
    });
  }

  select_taskfor_activity(request: any) {
    if (this.selectedRequestsActivity.length && this.selectedRequestsActivity[0].activityID === request.activityID) {
      this.selectedRequestsActivity = [];
    } else {
      this.selectedRequestsActivity = [request];
    }
  }

  selectedRequestsActivity: any[] = [];
  toggleSelectionforActivity(request: any, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedRequestsActivity = [request];
    } else {
      this.selectedRequestsActivity = this.selectedRequestsActivity.filter(r => r.activityID !== request.activityID);
    }
  }

  isSelectedtaskforactivity(request: any): boolean {
    return this.selectedRequestsActivity.some(r => r.activityID === request.activityID);
  }

    test_execution(execution_type: any) {

    if (this.filteredItems.length === 0) {
      this.commonService.displayWarning('No data available with this Task ID')
      return
    }

    if (execution_type === 'start') {
      const task_details = this.all_task.find((task: any) => task.taskID === this.selectedRequests[0]?.taskID)
      if (task_details.status === 'In Progress') {
        this.commonService.displayWarning('Cannot proceed — test already started for this task ID.')
        // this.searchText = ''
        return
      }
      const dialogRef = this.dialog.open(start_test, {
        data: { task_number: this.selectedRequests[0]?.taskID, all_task: this.all_task },
        width: '500px',
        panelClass: 'custom-dialog-container'
      })

      dialogRef.afterClosed().subscribe(detailResult => {
        this.searchText = ''
        this.selectedRequests = []
        this.tasklist_byTaskID = []
        this.selectedRequestsActivity = []
        if (detailResult !== 'submitted') return;
        this.get_all_task_request()
      });

    } else if (execution_type === 'end') {
      const task_details = this.tasklist_byTaskID.find((task: any) => task.activityID === this.selectedRequestsActivity[0]?.activityID)
      // if (task_details.status === 'Approved' || task_details.status === 'Completed') {
      //   this.commonService.displayWarning('Test not started yet — cannot cancel.')
      //   // this.searchText = ''
      //   return
      // }

      const dialogRef = this.dialog.open(end_test, {
        data: { all_task: task_details },
        width: '500px',
        panelClass: 'custom-dialog-container'
      })

      dialogRef.afterClosed().subscribe(detailResult => {
        this.searchText = ''
        this.selectedRequests = []
        this.tasklist_byTaskID = []
        this.selectedRequestsActivity = []
        if (detailResult !== 'submitted') return;
        this.get_all_task_request()
      });
    } else {
      const task_details = this.tasklist_byTaskID.find((task: any) => task.activityID === this.selectedRequestsActivity[0]?.activityID)
      const dialogRef = this.dialog.open(edit_test, {
        data: { all_task: task_details },
        width: '500px',
        panelClass: 'custom-dialog-container'
      })

      dialogRef.afterClosed().subscribe(detailResult => {
        this.searchText = ''
        this.selectedRequests = []
        this.tasklist_byTaskID = []
        this.selectedRequestsActivity = []
        if (detailResult !== 'submitted') return;
        this.get_all_task_request()
      });
    }
  }

}

// Start Test

@Component({
  selector: 'start_test',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  template: `
  <div class="container-fluid common_dialog">
    <div class="row">
      <div class="col-12">
        <h2>Start Test</h2>

    <form [formGroup]="start_test_form" (ngSubmit)="onSubmit()">
       <div class="form-group border p-1 pt-0">
           <div class="form_field">
               <label>Task number:</label>
               <input type="text" class="form-control" formControlName="task_number" [readOnly]="true">

               <label class="mt-1">Select Date to Start the Test:</label>
               <input type="datetime-local" class="form-control" formControlName="start_date">
               <div *ngIf="start_test_form.get('start_date')?.invalid && start_test_form.get('start_date')?.touched"
               class="text-danger error">
                  Start Date is required.
               </div>

                <!-- <label class="mt-3">Select Estimated End Test Date:</label>
               <input type="datetime-local" class="form-control" formControlName="estimated_end_date">
               <div *ngIf="start_test_form.get('estimated_end_date')?.invalid && start_test_form.get('estimated_end_date')?.touched"
               class="text-danger error">
                  Estimated End Test Date is required.
               </div> -->
           </div>
       </div>

       <div class="btn_div">
           <button type="submit" class="yesbtn" *ngIf="!Is_spinner">Submit</button>
           <button class="yesbtn" *ngIf="Is_spinner">
            <div class="spinner"></div>
        </button>
           <button type="reset" (click)="close()">Close</button>
       </div>
    </form>
 
      </div>
    </div>
  </div>
  `,
  styleUrl: './tech-interface.component.scss'
})

export class start_test {

  user_type = ['User', 'Lead', 'Tech', 'Admin', 'Inventory', 'Unknown'];
  start_test_form !: FormGroup;
  task_number: any
  task_details: any
  constructor(private fb: FormBuilder,
    private common_service: CommonServiceService,
    private api_service: AllApiServiceService,
    public dialogRef: MatDialogRef<start_test>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.task_number = data.task_number
    this.task_details = data.all_task.find((task: any) => task.taskID === this.task_number)
  }

  ngOnInit(): void {

    this.start_test_form = this.fb.group({
      task_number: ['', Validators.required],
      start_date: [this.formatDateForInput(new Date()), Validators.required],
      // estimated_end_date: ['', Validators.required],
    });

    if (this.task_details) {
      this.start_test_form.get('task_number')?.setValue(this.task_number)
      // this.start_test_form.get('start_date')?.setValue(this.task_details.requested_StartDate)
      // this.start_test_form.get('estimated_end_date')?.setValue(this.task_details.requested_EndDate)
    }
  }

  formatDateForInput(date: Date): string {
    const isoString = date.toISOString();
    return isoString.slice(0, 16); // Removes seconds and milliseconds
  }

  submit_response: any
  Is_spinner: boolean = false
  onSubmit() {
    if (this.start_test_form.valid) {
      this.Is_spinner = true
      const body = {
        UserID: 'H317697',
        activityID: this.task_details.activityID,
        taskID: this.start_test_form.get('task_number')?.value,
        startDate: this.start_test_form.get('start_date')?.value,
      }

      this.api_service.tech_interface_startTest(body).subscribe({

        next: (res) => {
          this.submit_response = res
          if (this.submit_response.status) {
            this.Is_spinner = false
            this.common_service.displaySuccess('Test started succesfully')
            this.dialogRef.close('submitted')
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
      this.start_test_form.markAllAsTouched();
      console.log('Form is not valid');
    }
  }

  close() {
    this.dialogRef.close()
  }
}

// Edit Test 

@Component({
  selector: 'edit_test',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  template: `
  <div class="container-fluid common_dialog">
    <div class="row">
      <div class="col-12">
        <h2>Edit Test</h2>

    <form [formGroup]="start_test_form" (ngSubmit)="onSubmit()">
       <div class="form-group border p-1 pt-0">
           <div class="form_field">
               <label>Task number:</label>
               <input type="text" class="form-control" formControlName="task_number" [readOnly]="true">

               <label class="mt-1">Test Started On:</label>
               <input type="datetime-local" class="form-control" formControlName="start_date" [readOnly]="true">

               <label class="mt-1">Select Date to End the Test:</label>
               <input type="datetime-local" class="form-control" formControlName="end_date" [readOnly]="true">

                <label class="mt-1">Total Test Duration In Hours:</label>
                <input type="number" class="form-control" formControlName="duration" 
                step="0.01" min="0.01" placeholder="Enter Total Test Duration In Hours"/>

                <div *ngIf="start_test_form.get('duration')?.touched">
                  <div *ngIf="start_test_form.get('duration')?.errors?.['required']" class="text-danger error">
                    Test Duration is required.
                  </div>
                  <div *ngIf="start_test_form.get('duration')?.errors?.['min']" class="text-danger error">
                    Duration must be greater than 0.
                  </div>
                </div>

           </div>
       </div>

       <div class="btn_div">
           <button type="submit" class="yesbtn" *ngIf="!Is_spinner">Submit</button>
           <button class="yesbtn" *ngIf="Is_spinner">
            <div class="spinner"></div>
          </button>
           <button type="reset" (click)="close()">Close</button>
       </div>
    </form>
 
      </div>
    </div>
  </div>
  `,
  styleUrl: './tech-interface.component.scss'
})

export class edit_test {

  user_type = ['User', 'Lead', 'Tech', 'Admin', 'Inventory', 'Unknown'];
  start_test_form !: FormGroup;
  task_number: any
  task_details: any;
  currentDate: any;
  constructor(private fb: FormBuilder,
    private common_service: CommonServiceService,
    private api_service: AllApiServiceService,
    public dialogRef: MatDialogRef<edit_test>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.task_number = data.all_task.taskID
    this.task_details = data.all_task
  }

  ngOnInit(): void {
    const now = new Date();
    this.currentDate = now.toISOString().slice(0, 16);
    this.start_test_form = this.fb.group({
      task_number: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      duration: [null, [Validators.required, Validators.min(0.01)]]
    });

    if (this.task_details) {
      this.start_test_form.get('task_number')?.setValue(this.task_number)
      this.start_test_form.get('start_date')?.setValue(this.task_details.requested_StartDate)
      this.start_test_form.get('end_date')?.setValue(this.task_details.requested_EndDate)
    }
  }

  submit_response: any
  Is_spinner: boolean = false
  onSubmit() {
    if (this.start_test_form.valid) {
      this.Is_spinner = true
      const body = {
        UserID: 'H317697',
        activityID: this.task_details.activityID,
        taskID: this.start_test_form.get('task_number')?.value,
        duration: this.start_test_form.get('duration')?.value,
        resource: this.task_details.resource,
        description: this.task_details?.description,
        requested_StartDate: this.start_test_form.get('start_date')?.value,
        requested_EndDate: this.start_test_form.get('end_date')?.value,
        status: "Completed",
      }

      this.api_service.tech_interface_editTest(body).subscribe({

        next: (res) => {
          this.submit_response = res
          if (this.submit_response.status) {
            this.Is_spinner = false
            this.common_service.displaySuccess('Test deails updated succesfully')
            this.dialogRef.close('submitted')
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
      this.start_test_form.markAllAsTouched();
      console.log('Form is not valid');
    }
  }

  close() {
    this.dialogRef.close()
  }
}

// End Test

@Component({
  selector: 'end_test',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  template: `
  <div class="container-fluid common_dialog">
    <div class="row">
      <div class="col-12">
        <h2>End Test</h2>

    <form [formGroup]="start_test_form" (ngSubmit)="onSubmit()">
       <div class="form-group border p-1 pt-0">
           <div class="form_field">
               <label>Task number:</label>
               <input type="text" class="form-control" formControlName="task_number" [readOnly]="true">

               <label class="mt-1">Test Started On:</label>
               <input type="datetime-local" class="form-control" formControlName="start_date" [readOnly]="true">

               <label class="mt-1">Select Date to End the Test:</label>
               <input type="datetime-local" class="form-control" formControlName="end_date" >
               <div *ngIf="start_test_form.get('end_date')?.invalid && start_test_form.get('end_date')?.touched"
               class="text-danger error">
                  End Date is required.
               </div>

                <label class="mt-1">Total Test Duration In Hours:</label>
                <input type="number" class="form-control" formControlName="duration" 
                step="0.01" min="0.01" placeholder="Enter Total Test Duration In Hours"/>

                <div *ngIf="start_test_form.get('duration')?.touched">
                  <div *ngIf="start_test_form.get('duration')?.errors?.['required']" class="text-danger error">
                    Test Duration is required.
                  </div>
                  <div *ngIf="start_test_form.get('duration')?.errors?.['min']" class="text-danger error">
                    Duration must be greater than 0.
                  </div>
                </div>

           </div>
       </div>

       <div class="btn_div">
           <button type="submit" class="yesbtn" *ngIf="!Is_spinner">Submit</button>
           <button class="yesbtn" *ngIf="Is_spinner">
            <div class="spinner"></div>
          </button>
           <button type="reset" (click)="close()">Close</button>
       </div>
    </form>
 
      </div>
    </div>
  </div>
  `,
  styleUrl: './tech-interface.component.scss'
})

export class end_test {

  user_type = ['User', 'Lead', 'Tech', 'Admin', 'Inventory', 'Unknown'];
  start_test_form !: FormGroup;
  task_number: any
  task_details: any;
  currentDate: any;
  constructor(private fb: FormBuilder,
    private common_service: CommonServiceService,
    private api_service: AllApiServiceService,
    public dialogRef: MatDialogRef<end_test>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.task_number = data.all_task.taskID
    this.task_details = data.all_task
  }

  ngOnInit(): void {
    const now = new Date();
    this.currentDate = now.toISOString().slice(0, 16);
    this.start_test_form = this.fb.group({
      task_number: ['vfxsdfsdf', Validators.required],
      start_date: ['', Validators.required],
      end_date: [this.formatDateForInput(new Date()), Validators.required],
      duration: [null, [Validators.required, Validators.min(0.01)]]
    });

    if (this.task_details) {
      this.start_test_form.get('task_number')?.setValue(this.task_number)
      this.start_test_form.get('start_date')?.setValue(this.task_details.requested_StartDate)
      // this.start_test_form.get('end_date')?.setValue(this.task_details.requested_EndDate)
    }

    // this.get_form_value()
  }

  formatDateForInput(date: Date): string {
    const isoString = date.toISOString();
    return isoString.slice(0, 16); // Removes seconds and milliseconds
  }

  submit_response: any
  Is_spinner: boolean = false
  onSubmit() {
    if (this.start_test_form.valid) {
      this.Is_spinner = true
      const body = {
        UserID: 'H317697',
        activityID: this.task_details.activityID,
        taskID: this.start_test_form.get('task_number')?.value,
        endDate: this.start_test_form.get('end_date')?.value,
        duration: this.start_test_form.get('duration')?.value,
      }

      this.api_service.tech_interface_endTest(body).subscribe({

        next: (res) => {
          this.submit_response = res
          if (this.submit_response.status) {
            this.Is_spinner = false
            this.common_service.displaySuccess('Test ended succesfully')
            this.dialogRef.close('submitted')
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
      this.start_test_form.markAllAsTouched();
      console.log('Form is not valid');
    }
  }

  close() {
    this.dialogRef.close()
  }
}