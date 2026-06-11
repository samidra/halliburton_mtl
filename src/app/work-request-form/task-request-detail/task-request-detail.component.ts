import { Component, ElementRef, HostListener, Inject, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { CommonServiceService } from '../../Services/common-service.service';
import { AllApiServiceService } from '../../Services/all-api-service.service';
import { LocalStorageService } from '../../Services/local-storage.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { CdkDragPlaceholder } from "@angular/cdk/drag-drop";
import { AuthService, User } from '../../Services/auth/auth.service';
@Component({
  selector: 'app-task-request-detail',
  imports: [CommonModule, CdkDragPlaceholder],
  templateUrl: './task-request-detail.component.html',
  styleUrl: './task-request-detail.component.scss',
  standalone: true,
})

export class TaskRequestDetailComponent {
  allstatus = ['Draft', 'Completed', 'Submitted', 'Approved', 'Approval Pending', 'Tentatively Approved', 'Cancelled']
  readonly isValidForEdit = ['Submitted', 'Approved', 'Approval Pending', 'Tentatively Approved', 'Completed', 'In Progress', 'Paused'];
  readonly isValidForchangeToDraft = ['Submitted', 'Approved', 'Approval Pending', 'Tentatively Approved',];
  readonly isValidForCancel = ['Draft', 'Submitted', 'Approved', 'Approval Pending', 'Tentatively Approved',];
  readonly isValidForcomplete_draft_request = ['Draft'];
  readonly isValidForSubmitForApproval = ['Submitted'];
  readonly isValidForClicktoApprove = ['Approval Pending', 'Tentatively Approved'];
  approversList: any[] = []
  readonly isRestrictedIfCompleted = ['Completed']
  readonly heightAdjust = ['Submitted', 'Draft', 'Approval Pending', 'Tentatively Approved']
  User: User | null | undefined | any;
  private userSubscription: Subscription | undefined;
  user_id: any;
  userName: any;
  constructor(private titleService: Title,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private apiservice: AllApiServiceService,
    private local_storage: LocalStorageService,
    private common_service: CommonServiceService,
    private dialog: MatDialog) {

  }
  request_number: any
  task_number: any
  isLoading: boolean = true
  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.User = user;
      const input = this.User?.userName;
      let parts: any = input?.split('\\');
      if (parts && parts.length > 1) {
        this.user_id = parts[1];
        this.userName = this.user_id + ' - ' + this.User?.displayName
      }
    })

    // const taskData = sessionStorage.getItem('task_details_by_index');
    // this.task_details_by_index = JSON.parse(taskData);
    this.route.paramMap.subscribe((params) => {
      const request_number = params.get('work_request_no')
      const task_number = params.get('task_request_no')
      this.request_number = request_number
      this.task_number = task_number
      this.get_task_request_details()

    })
    this.titleService.setTitle(`Task Request Detail ${this.task_number} | TestTrack HALLIBURTON`);
  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }

  task_details: any
  private hasDisplayedMessage = false;
  chargeCode_WorkOrder_list: any
  get_task_request_details() {

    this.apiservice.get_taskrequest_details(this.task_number).subscribe({
      next: (res) => {
        if (res && Array.isArray(res) && res.length > 0) {
          this.task_details = res[0];
          if (this.task_details?.approvers?.length) {
            let uniqueApprovers = this.task_details?.approvers?.map((item: string) => item.trim())
            this.approversList = [...uniqueApprovers]
          }
          if (this.task_details?.charge_Codes != '') {
            this.chargeCode_WorkOrder_list = this.task_details?.charge_Codes.split(',')
          } else if (this.task_details?.work_Orders != '') {
            this.chargeCode_WorkOrder_list = this.task_details?.work_Orders.split(',')
          }
          this.contacts = this.task_details.contacts
          this.log_entry_data = this.task_details.loglists
          this.upload_file_details = this.task_details.fileInfo
          this.upload_link = this.task_details.link
          if (!this.hasDisplayedMessage) {
            const status = this.task_details?.test_Status;
            if (status === 'Submitted') {
              this.common_service.displaySuccess("To schedule as per duration, click on Submit for Approval.");
            } else if (status === 'Draft') {
              this.common_service.displaySuccess("This request is not completed. To complete, click on 'Complete this request' button.");
            } else if (status === 'Approval Pending' && (this.User?.role === 'Admin' || this.User?.role === 'Lead' || this.User?.role === 'Tech')) {
              this.common_service.displaySuccess("To Approve , click on 'Click to approve' button.");
            }
            this.hasDisplayedMessage = true;
          }

        } else {
          this.task_details = null; // or {}
        }

        this.isLoading = false
      },
      error: (err) => {

      }
    })
  }

  modify_details(request_task_action: any) {

    const allowedRoles = ['Admin', 'User'];
    if (!allowedRoles.includes(this.User?.role)) {
      this.common_service.displayWarning(`You don't have permission to modify details, only Admin and User can do that.`);
      return;
    }
    const dialogRef = this.dialog.open(modify_details, {
      data: {
        user_id: this.user_id,
        work_data: this.task_details,
        is_new: request_task_action
      },
      width: '600px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'submitted') {
        this.get_task_request_details()
        window.scrollTo(0, 0)
      }
    })
  }

  delete_Request(delete_type: any, name: any) {
    const allowedRoles = ['Inventory'];
    if (allowedRoles.includes(this.User?.role)) {
      this.common_service.displayWarning(`You don't have permission to delete`);
      return;
    }
    const deleteRef = this.dialog.open(delete_request, {
      data: {
        user_id: this.user_id,
        delete_type: delete_type,
        taskId: this.task_number,
        name: name,
      },
      width: '300px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
    })

    deleteRef.afterClosed().subscribe(result => {
      this.get_task_request_details()
      window.scrollTo(0, 0)
    })
  }

  reason_for_cancellng: any;
  taskStatusChanger(value: any) {
    if (value === 'cancel') {
      const allowedRoles = ['Admin', 'Tech'];
      if (!allowedRoles.includes(this.User?.role)) {
        this.common_service.displayWarning(`You don't have permission to cancel test, only Admin and Tech can do that.`);
        return;
      }
    } else if (value === 'draft') {
      const allowedRoles = ['Admin', 'Lead'];
      if (!allowedRoles.includes(this.User?.role)) {
        this.common_service.displayWarning(`You don't have permission to change to Draft, only Admin and Lead can do that.`);
        return;
      }
    } else if (value === 'Approval Pending') {
      const allowedRoles = ['Admin', 'Lead', 'Tech'];
      if (!allowedRoles.includes(this.User?.role)) {
        this.common_service.displayWarning(`You don't have permission, only Admin, Lead, and Tech can do that.`);
        return;
      }
    }

    const dialogRef = this.dialog.open(cancel_change_to_draft, {
      data: {
        user_id: this.user_id,
        value: value,
        word_id: this.request_number,
        taskId: this.task_number,
      },
      width: '300px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe(result => {
      this.reason_for_cancellng = result
      this.get_task_request_details()
      window.scrollTo(0, 0)

      if(result === 'submitted for approval') {
        const data = {
      selected_location: this.task_details.location,
      selected_resource: this.task_details.resource,
    };
    
    this.local_storage.setCalendarLocationCache(data);
    this.router.navigate([`calendar`]);
      }
    })
  }

  upload_file_details: any;
  upload_file() {
    const allowedRoles = ['Inventory'];
    if (allowedRoles.includes(this.User?.role)) {
      this.common_service.displayWarning(`You don't have permission to add File`);
      return;
    }
    const dialogRef = this.dialog.open(upload_file, {
      data: {
        user_id: this.user_id,
        taskId: this.task_number
      },
      width: '300px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.get_task_request_details()
      }
    })
  }

  upload_link: any
  add_link() {
    const allowedRoles = ['Inventory'];
    if (allowedRoles.includes(this.User?.role)) {
      this.common_service.displayWarning(`You don't have permission to add Link`);
      return;
    }
    const dialogRef = this.dialog.open(add_link, {
      data: {
        user_id: this.user_id,
        taskId: this.task_number
      },
      width: '300px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.get_task_request_details()
      }
    })
  }

  contacts: any
  add_contact() {
    const allowedRoles = ['Inventory'];
    if (allowedRoles.includes(this.User?.role)) {
      this.common_service.displayWarning(`You don't have permission to add Contact`);
      return;
    }
    const dialogRef = this.dialog.open(add_contact, {
      data: {
        user_id: this.user_id,
        taskId: this.task_number
      },
      width: '300px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // this.contacts.push(result);
        this.get_task_request_details()

      }
    })
  }

  log_entry_data: any
  add_log_entries() {
    const allowedRoles = ['Admin', 'Lead', 'Tech'];
    if (!allowedRoles.includes(this.User?.role)) {
      this.common_service.displayWarning(`You don't have permission to add Log Entry, only Admin, Lead, and Tech can do that.`);
      return;
    }
    const dialogRef = this.dialog.open(add_log_entries, {
      data: {
        user_id: this.user_id,
        displayName: this.User?.displayName,
        workId: this.request_number,
        taskId: this.task_number
      },
      width: '600px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // this.log_entry_data.push(result);
        this.get_task_request_details()
      }
    })
  }

  submit_approval(item: any) {
    const allowedRoles = ['Admin', 'User'];
    if (!allowedRoles.includes(this.User?.role)) {
      this.common_service.displayWarning(`You don't have permission to submit test for Approval, only Admin and User can do that.`);
      return;
    }
    const data = {
      user_id: this.user_id,
      wRnumber: this.request_number,
      taskNumber: item.taskId,
      duration: item.daysRequested,
      location: item.location,
      resource: item.resource,
    };
    this.local_storage.setDataFormCalender(data);
    this.router.navigate([`calendar`, this.request_number, item.taskId]);
  }

  download_file(fileName: any) {
    const allowedRoles = ['Inventory'];
    if (allowedRoles.includes(this.User?.role)) {
      this.common_service.displayWarning(`You don't have permission to Download File`);
      return;
    }
    this.isLoading = true
    this.apiservice.download_file(fileName).subscribe({
      next: (res: any) => {
        this.isLoading = false
        const blob = new Blob([res], { type: res.type || 'application/octet-stream' });
        // Create a download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        this.common_service.displaySuccess(`${fileName} is downloaded sucessfully.`)
      },
      error: (err) => {
        this.isLoading = false
        console.error("File download failed:", err);
      }
    });
  }

  dataCenterRoute() {
    if (!this.task_details?.resource) return
    const resource = this.task_details?.resource?.toLowerCase() || '';
    const centerType = resource.includes('pressure') ? 'pressure-data-center' : 'data-center'
    this.router.navigate([`/test/${centerType}/${this.task_number}`], { state: { resource: this.task_details?.resource } })
  }

}

// Modify Task Details
@Component({
  selector: 'modify_details',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
  <div class="container-fluid common_dialog modify">
  <div class="row">
    <div class="col-12">
      <h2>Modify Task Information</h2>

      <form autocomplete="off" [formGroup]="modify_form" class="mt-2" >

        <div class="form-group">
          <div class="form_field">
            <label>Work ID / Task ID: </label>
            <label style="color:grey;">{{task_data?.workId}} / {{task_data?.taskId}}</label>

          </div>
        </div>

        <div class="form-group">
          <div class="form_field">
            <label for="requestDescription">Description:</label>

            <input type="text" id="requestDescription" class="form-control" formControlName="description"
              placeholder="Description" />
          </div>
          <div *ngIf="modify_form.get('description')?.invalid && modify_form.get('description')?.touched"
            class="text-danger error">
            Description is required.
          </div>
        </div>

        <div class="form-group">
          <div class="form_field">
            <label for="location">Location: </label>
            <div class="form_field_dropdown" style="width: 100%;">
              <input id="location" type="text" class="form-control" placeholder="Search location"
                formControlName="location" (input)="input_location()" required (click)="show('location')" #inputField>
              <ul *ngIf="locationOptions.length !=0" class="list_drop" #dropdownContainer>
                <li *ngFor="let option of locationOptions"
                  (click)="option !== 'No data with this search' ? selectOption('location', option) : errorMessage('Location','location')">
                  {{option}}</li>
              </ul>
            </div>
          </div>
          <div *ngIf="modify_form.get('location')?.invalid && modify_form.get('location')?.touched"
            class="text-danger error">
            <div *ngIf="modify_form.get('location')?.hasError('required')">
              Location is required.
            </div>

            <div *ngIf="modify_form.get('location')?.hasError('noMatch')">
              Please select a valid location.
            </div>
          </div>
        </div>

        <div class="form-group">
          <div class="form_field">
            <label for="resources">Resources: </label>
            <div class="form_field_dropdown" style="width: 100%;">
              <input id="resources" type="text" class="form-control" placeholder="Search location wise resources"
                formControlName="resources" (click)="show('resources')" #inputField>
              <ul *ngIf="resourcesOptions?.length !=0" class="list_drop" #dropdownContainer>
                <li *ngFor="let option of resourcesOptions"
                  (click)="option !== 'No data with this search' ? selectOption('resources', option) : errorMessage('Resources','resources')">
                  {{option}}
                </li>
              </ul>
            </div>
          </div>
          <div *ngIf="modify_form.get('resources')?.invalid && modify_form.get('resources')?.touched"
            class="text-danger error">
            <div *ngIf="modify_form.get('resources')?.hasError('required')">
              Resources is required.
            </div>

            <div *ngIf="modify_form.get('resources')?.hasError('noMatch')">
              Please select a valid Resources.
            </div>
          </div>
        </div>

        <div class="form-group">
          <div class="form_field">
            <label for="duration">Duration (days):</label>

            <input type="number" id="duration" class="form-control" formControlName="duration"
              placeholder="Duration (days)" />
          </div>
          <div *ngIf="modify_form.get('duration')?.invalid && modify_form.get('duration')?.touched"
            class="text-danger error">
            Duration is required.
          </div>
        </div>

        <!-- Charge Code  or work Order Option-->
        <div class="form-group">
          <div class="form_field">
            <label>Select Charge Code or Work Order: </label>
            <div class="border d-flex">
              <div>
                <label>
                  <input type="radio" class="mx-1" formControlName="Select_Charge_Code_or_Work_Order"
                    value="chargeCode"> Charge Code
                </label>
              </div>

              <div class="mx-4">
                <label>
                  <input type="radio" class="mx-1" formControlName="Select_Charge_Code_or_Work_Order" value="workOrder">
                  Work Order
                </label>
              </div>
            </div>
          </div>
          <div
            *ngIf="modify_form.get('Select_Charge_Code_or_Work_Order')?.invalid && modify_form.get('Select_Charge_Code_or_Work_Order')?.touched"
            class="text-danger error">
            <div *ngIf="modify_form.get('Select_Charge_Code_or_Work_Order')?.hasError('required')">
              Please select either a Charge Code or a Work Order to proceed.
            </div>
          </div>
        </div>

        <!-- Charge Code -->
        <div class="form-group" *ngIf="modify_form.get('Select_Charge_Code_or_Work_Order')?.value === 'chargeCode'">
          <div class="form_field">
            <label for="chargeCode">Charge Code: </label>
            <div class="form_field_dropdown">
              <input id="chargeCode" type="text" class="form-control" placeholder="Search charge code"
                style="margin-right: 10px;" formControlName="chargeCode" (click)="show('chargeCode')" #inputField>
              <ul *ngIf="chargeCodeOptions.length !=0" class="list_drop" #dropdownContainer>
                <li *ngFor="let item of chargeCodeList" class="selected-item">
                  <input type="checkbox" checked (change)="toggleSelection(item)">
                  <span class="label-text" (click)="removechargeCode(item)" [title]="item">
                    {{ (item.length > 50) ? (item | slice:0:50) + '...' : item }}
                  </span>
                </li>

                <ng-container *ngFor="let option of chargeCodeOptions">
                  <li *ngIf="!chargeCodeList.includes(option)" (click)="toggleSelection(option)" class="selected-item">
                    <input type="checkbox" [checked]="false" *ngIf="option !== 'No data with this search'">
                    <span class="label-text" [title]="option">
                      {{ (option.length > 50) ? (option | slice:0:50) + '...' : option }}
                    </span>
                  </li>
                </ng-container>
              </ul>
              <!-- <ul *ngIf="chargeCodeOptions.length !=0" class="list_drop" #dropdownContainer>
                                    <li *ngFor="let option of chargeCodeOptions"

                                        (click)="option !== 'No data with this search' ? selectOption('chargeCode', option) : errorMessage('Charge Code','chargeCode')">{{option}}</li>
                                </ul> -->
            </div>
          </div>
          <div class="user_detail" *ngIf="chargeCodeList.length != 0">
            <div class="detail_box">
              <h5>
                <span style="color: black; font-weight: 600;">View selected Charge
                  Code
                </span>
                <i class="bi bi-chevron-double-down mx-2"></i>
              </h5>
              <div class="name">
                <div class="key-descriptions" *ngFor="let item of chargeCodeList" [title]="item">
                  <i class="bi bi-x-circle-fill" (click)="removechargeCode(item)"></i>
                  <!-- {{item.split('-')[0]}} -->
                  {{ (item.length > 40) ? (item | slice:0:40) + '...' : item }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Activity Code -->
        <div class="form-group" *ngIf="activityCodeShow">
          <div class="form_field">
            <label for="activityCode">Activity Code:</label>

            <input type="text" id="activityCode" class="form-control" formControlName="activityCode"
              placeholder="Enter Activity Code" />
          </div>
          <div *ngIf="modify_form.get('activityCode')?.invalid && modify_form.get('activityCode')?.touched"
            class="text-danger error">
            Activity Code is required.
          </div>
        </div>

        <!-- Work Order -->
        <div class="form-group" *ngIf="modify_form.get('Select_Charge_Code_or_Work_Order')?.value === 'workOrder'">
          <div class="form_field">
            <label for="workOrder">Work Order:</label>
            <div class="d-flex">
              <input type="text" id="workOrder" class="form-control"
                style="width: 350px !important; margin-right: 10px;" formControlName="workOrder"
                placeholder="Write your Work Order" />
              <button type="button" class="button" (click)="add_workOrder('workOrder')">Add More</button>
            </div>
          </div>
          <div class="user_detail" *ngIf="workOrderList.length != 0">
            <div class="detail_box">
              <h5>
                <span style="color: black; font-weight: 600;">View selected Charge
                  Code
                </span>
                <i class="bi bi-chevron-double-down mx-2"></i>
              </h5>
              <div class="name">
                <div class="key-descriptions" *ngFor="let item of workOrderList" [title]="item">
                  <i class="bi bi-x-circle-fill" (click)="removeworkOrder(item)"></i>
                  <!-- {{item.split('-')[0]}} -->
                  {{ (item.length > 40) ? (item | slice:0:40) + '...' : item }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- lithium_batteries -->
        <div class="form-group">
          <div class="form_field">
            <label for="lithium_battery">Lithium Battery:</label>
            <div class="d-flex border">
              <div class="check_div">
                <input type="radio" id="yes" formControlName="lithium_batteries" [value]="true" />
                <label for="yes">Yes</label>
              </div>
              <div class="check_div">
                <input type="radio" id="no" formControlName="lithium_batteries" [value]="false" />
                <label for="no">No</label>
              </div>
            </div>
          </div>

          <div *ngIf="modify_form.get('lithium_batteries')?.invalid &&
                                modify_form.get('lithium_batteries')?.touched" class="text-danger error">
            Please select this field. It is required.
          </div>
        </div>

        <div class="form-group" *ngIf="modify_form.get('lithium_batteries')?.value === true">
          <div class="form_field">
            <label for="lithium_batteries_description">Lithium Battery Description:</label>

            <input type="text" id="lithium_batteries_description" class="form-control"
              formControlName="lithium_batteries_description" placeholder="Write description for Lithium Battery" />
          </div>
          <div
            *ngIf="modify_form.get('lithium_batteries_description')?.invalid && modify_form.get('lithium_batteries_description')?.touched"
            class="text-danger error">
            Lithium Battery Description is required.
          </div>
        </div>

        <!-- Radiation -->
        <div class="form-group">
          <div class="form_field">
            <label>Radiation:</label>
            <div class="d-flex border">
              <div class="check_div">
                <input type="radio" id="radiation_yes" formControlName="Radiation" [value]="true" />
                <label for="radiation_yes">Yes</label>
              </div>
              <div class="check_div">
                <input type="radio" id="radiation_no" formControlName="Radiation" [value]="false" />
                <label for="radiation_no">No</label>
              </div>
            </div>
          </div>

          <div *ngIf="modify_form.get('Radiation')?.invalid &&
                            modify_form.get('Radiation')?.touched" class="text-danger error">
            Please select this field. It is required.
          </div>
        </div>

        <div class="form-group" *ngIf="modify_form.get('Radiation')?.value === true">
          <div class="form_field">
            <label for="Radiation_description">Radiation Description:</label>

            <input type="text" id="Radiation_description" class="form-control" formControlName="Radiation_description"
              placeholder="Write description for Radiation" />
          </div>
          <div
            *ngIf="modify_form.get('Radiation_description')?.invalid && modify_form.get('Radiation_description')?.touched"
            class="text-danger error">
            Radiation Description is required.
          </div>
        </div>

        <div class="btn_div" *ngIf="this.is_new != 'new'">
          <button type="button" class="yesbtn" *ngIf="!Is_spinner" (click)="modify_detail_submit()">Update</button>
          <button type="button" class="yesbtn" *ngIf="Is_spinner">
            <div class="spinner"></div>
          </button>
          <button type="button" (click)="close()">Cancel</button>
        </div>
      </form>


    </div>
  </div>
</div>
  `,
  styleUrl: './task-request-detail.component.scss'
})

export class modify_details {

  task_data: any
  is_new: any
  locationOptions: string[] = [];
  resourcesOptions: string[] = [];
  chargeCodeOptions: string[] = [];
  workOrderList: any = []
  chargeCodeList: any = []
  user_id: any
  activityCodeShow: boolean = false
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
      this.locationOptions = [];
      this.resourcesOptions = [];
      this.chargeCodeOptions = [];
    }

  }

  constructor(private fb: FormBuilder,
    public local_storage: LocalStorageService,
    public router: Router,
    private api_service: AllApiServiceService,
    public dialogRef: MatDialogRef<modify_details>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private common_service: CommonServiceService) {
    this.user_id = data.user_id
    this.is_new = data.is_new
    this.task_data = data.work_data
  }

  modify_form !: FormGroup;
  ngOnInit(): void {
    this.modify_form = this.fb.group({
      work_id: ['', Validators.required],
      task_id: ['', Validators.required],
      description: ['', [Validators.required]],
      location: ['', Validators.required],
      resources: [{ value: '', disabled: true }, Validators.required],
      Select_Charge_Code_or_Work_Order: ['', Validators.required],
      chargeCode: [''],
      workOrder: [''],
      activityCode: [''],
      duration: ['', Validators.required],
      lithium_batteries: ['', Validators.required],
      Radiation: ['', Validators.required]
    })

    this.form_validator()
  }

  form_validator() {
    this.modify_form.get('location')?.valueChanges.subscribe(value => {
      this.handleLocationChange(value);
    });

    this.modify_form.get('lithium_batteries')?.valueChanges.subscribe(value => {
      if (value != true) { return }
      this.modify_form.addControl('lithium_batteries_description', new FormControl('', [Validators.required]));
      if (value === true) { this.modify_form.get('lithium_batteries_description')?.setValue('') }
    })

    this.modify_form.get('Radiation')?.valueChanges.subscribe(value => {
      if (value != true) { return }
      this.modify_form.addControl('Radiation_description', new FormControl('', [Validators.required]));
      if (value === true) { this.modify_form.get('Radiation_description')?.setValue('') }
    })

    const formFields = [
      { field: 'work_id', value: this.task_data.workId },
      { field: 'task_id', value: this.task_data.taskId },
      { field: 'description', value: this.task_data.description },
      { field: 'location', value: this.task_data.location },
      { field: 'resources', value: this.task_data.resource },
      { field: 'duration', value: this.task_data.daysRequested },
      { field: 'lithium_batteries', value: this.task_data.lithiumBattery },
      { field: 'lithium_batteries_description', value: this.task_data.lithiumBatteryDescription },
      { field: 'Radiation', value: this.task_data.radiation },
      { field: 'Radiation_description', value: this.task_data.radiationDescription },
    ]

    formFields.forEach(field => {
      const control = this.modify_form.get(field.field);
      if (control && (control.value === '' || control.value === null || control.value === undefined)) {
        control.setValue(field.value);
      }
    });

    if (this.task_data?.charge_Codes != '') {
      this.modify_form.get('Select_Charge_Code_or_Work_Order')?.setValue('chargeCode')
      this.chargeCodeList = this.task_data?.charge_Codes != '' ? this.task_data?.charge_Codes?.split(',') : []

      if (this.chargeCodeList.some((item: string) => item?.trim().toUpperCase().startsWith('HT'))) {
        this.modify_form.get('activityCode')?.setValue(this.task_data.activityCode)
        this.activityCodeShow = true
      }
    }

    if (this.task_data?.work_Orders != '') {
      this.modify_form.get('Select_Charge_Code_or_Work_Order')?.setValue('workOrder')
      this.workOrderList = this.task_data?.work_Orders != '' ? this.task_data?.work_Orders?.split(',') : []
    }

    this.modify_form.get('Select_Charge_Code_or_Work_Order')?.valueChanges.subscribe((value) => {
      if (value === 'workOrder') {
        this.chargeCodeList = []
        this.activityCodeShow = false
        this.modify_form.get('activityCode')?.setValue('')
        this.modify_form.get('activityCode')?.clearValidators()
        this.modify_form.get('activityCode')?.markAsUntouched()
        this.modify_form.get('activityCode')?.updateValueAndValidity()
      } else {
        this.workOrderList = []

        if (this.task_data?.charge_Codes != '') {
          this.modify_form.get('Select_Charge_Code_or_Work_Order')?.setValue('chargeCode')
          this.chargeCodeList = this.task_data?.charge_Codes != '' ? this.task_data?.charge_Codes?.split(',') : []

          if (this.chargeCodeList.some((item: string) => item?.trim().toUpperCase().startsWith('HT'))) {
            this.modify_form.get('activityCode')?.setValue(this.task_data.activityCode)
            this.activityCodeShow = true
          }
        }
      }
    })

    this.get_data_create_request();
  }

  handleLocationChange(value: string): void {
    const locationControl = this.modify_form.get('location');
    const resourcesControl = this.modify_form.get('resources');

    const isLocationInvalid = !value || locationControl?.invalid;

    if (isLocationInvalid) {
      resourcesControl?.disable();
      resourcesControl?.setValue('');
    } else {
      resourcesControl?.enable();
    }
  }

  private subscribeToFieldChanges(field: string, dataKey: string): void {
    this.modify_form.get(field)?.valueChanges.subscribe(value => {
      this.filterOptions(field, value, dataKey);
    });
  }

  allDataRes: any
  get_data_create_request() {
    this.api_service.get_data_create_request().subscribe((res) => {
      this.allDataRes = res
      this.subscribeToFieldChanges('location', 'test_Location')
      this.subscribeToFieldChanges('chargeCode', 'charge_Code')
    })
  }

  filterOptions(field: string, value: string, dataKey: string): void {
    const searchTerm = value?.trim().toLowerCase();
    const field_name = `${field}Options` as keyof this;

    const allOptions: string[] = this.allDataRes[0][dataKey];

    let filteredOptions = allOptions;
    if (searchTerm) {
      const matchingOptions = allOptions.filter((option: string) =>
        option.toLowerCase().includes(searchTerm)
      );

      filteredOptions = matchingOptions.length > 0 ? matchingOptions : ['No data with this search'];
    }
    (this as any)[field_name] = filteredOptions;
    const formControl = this.modify_form.get(field);
    if (formControl) {
      const currentValue = formControl.value;
      const isValidOption = allOptions.includes(currentValue);

      if (!isValidOption && currentValue) {
        formControl.setErrors({ noMatch: true });
      } else {
        formControl.setErrors(null);
      }
    }
    if (field_name === 'locationOptions') {
      this.modify_form.get('resources')?.setValue('');
    }
  }

  show(value: string): void {
    const optionsMap = {
      location: 'test_Location',
      resources: 'locationWiseResources',
      chargeCode: 'charge_Code'
    };

    const optionKeys = ['location', 'resources', 'chargeCode'];

    optionKeys.forEach((key: any) => {
      const field = `${key}Options` as keyof this
      (this as any)[field] = [];
    });

    const dataKey = value as keyof typeof optionsMap
    if (optionsMap[dataKey]) {
      (this as any)[`${value}Options`] = this.allDataRes[0][optionsMap[dataKey]];
      if (optionsMap[dataKey] === 'locationWiseResources') {
        const loc = this.modify_form.get('location')?.value.trim().toLowerCase()
        this.location_index = this.allDataRes[0].locationWiseResources.findIndex((item: { loc: string; }) => item.loc.trim().toLowerCase() === loc)
        const resourceArray = this.allDataRes[0][optionsMap[dataKey]];
        (this as any)[`${value}Options`] = resourceArray[this.location_index]?.res || [];
      }
    }

    Object.keys(this.modify_form.controls).forEach(controlName => {
      const control = this.modify_form.get(controlName);
      if (control) {
        control.valueChanges.subscribe(() => {
          // alert(`Value changed in control: ${controlName}`);
          control.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        });
      }
    });
  }

  selectOption(field: any, option: string): void {
    const field_name = `${field}Options` as keyof this
    this.modify_form.get(field)?.setValue(option);
    (this as any)[field_name] = [];

    if (field === 'location') {
      const loc = option.trim().toLowerCase()
      const i = this.allDataRes[0].locationWiseResources.findIndex((item: { loc: string; }) => item.loc.trim().toLowerCase() === loc)
      this.location_index = i
      this.locationwise_resource()

    }

    if (field === 'chargeCode') {
      this.modify_form.get('chargeCode')?.setValue(option);
      const selected = this.modify_form.get('chargeCode')?.value;
      if (!this.chargeCodeList.includes(selected)) {
        this.chargeCodeList.push(selected);
        if (this.chargeCodeList.some((item: string) => item.startsWith('HT'))) {
          this.activityCodeShow = true;
          this.modify_form.get('activityCode')?.setValidators([Validators.required]);
        } else {
          this.activityCodeShow = false
          this.modify_form.get('activityCode')?.setValue('')
          this.modify_form.get('activityCode')?.clearValidators()
          this.modify_form.get('activityCode')?.markAsUntouched()
          this.modify_form.get('activityCode')?.updateValueAndValidity()
        }
      } else {
        this.common_service.displayWarning('Charge Code already exists');
      }
      this.modify_form.get('chargeCode')?.setValue('');
      (this as any)[field_name] = [];
    }
  }

  location_index: any
  locationwise_resource() {
    if (this.location_index !== -1) {
      this.resourcesOptions = this.allDataRes[0].locationWiseResources[this.location_index].res;
      this.modify_form.get('resources')?.valueChanges.subscribe(value => {
        this.filterResourceOptions(value)
      });
    } else {
      this.modify_form.get('resources')?.setValue('');
      this.resourcesOptions = [];
      const resourcesControl = this.modify_form.get('resources');
      resourcesControl?.disable();
      this.common_service.displayWarning('No resources found for this location');
    }
  }

  filterResourceOptions(value: string): void {
    const searchTerm = value?.trim().toLowerCase();
    const allOptions = this.allDataRes[0].locationWiseResources[this.location_index].res;
    const matchingOptions = allOptions.filter((option: string) =>
      option.toLowerCase().includes(searchTerm)
    );


    this.resourcesOptions = matchingOptions.length > 0 ? matchingOptions : ['No data with this search'];

    const formControl = this.modify_form.get('resources');
    if (formControl) {
      const currentValue = formControl.value;
      const isValidOption = allOptions.includes(currentValue);

      if (!isValidOption && currentValue) {
        formControl.setErrors({ noMatch: true });
      } else {
        formControl.setErrors(null);
      }
    }
  }

  add_workOrder(field: any) {
    if (field === 'workOrder') {
      const value = this.modify_form.get('workOrder')?.value.toLowerCase()
      if (value === '' || this.workOrderList.includes(value)) {
        if (value === '') {
          this.common_service.displayWarning('Work order cannot be empty.');
        } else {
          this.common_service.displayWarning('This work order is already added.');
        }
        return;
      }
      this.workOrderList.push(value);
      this.modify_form.get('workOrder')?.setValue('');
    }

  }

  toggleSelection(option: string) {
    if (option === 'No data with this search') {
      this.errorMessage('Charge Code', 'chargeCode')
      return
    };

    const index = this.chargeCodeList.indexOf(option)
    if (index > -1) {
      this.chargeCodeList.splice(index, 1);
    } else {
      this.chargeCodeList.push(option);
    }

    const hasHTCode = this.chargeCodeList.some((item: String) => item.startsWith('HT'))
    this.activityCodeShow = hasHTCode;

    const activityCtrl = this.modify_form.get('activityCode');
    if (hasHTCode) {
      activityCtrl?.setValidators([Validators.required]);
    } else {
      activityCtrl?.clearValidators();
    }
    activityCtrl?.updateValueAndValidity();
    this.modify_form.get('chargeCode')?.setValue('');
  }

  removechargeCode(item: any) {
    const index = this.chargeCodeList.indexOf(item);
    if (index !== -1) {
      this.chargeCodeList.splice(index, 1);
      if (this.chargeCodeList.some((item: string) => item.startsWith('HT'))) {
        this.activityCodeShow = true;
      } else {
        this.activityCodeShow = false
        this.modify_form.get('activityCode')?.setValue('')
        this.modify_form.get('activityCode')?.clearValidators()
        this.modify_form.get('activityCode')?.markAsUntouched()
        this.modify_form.get('activityCode')?.updateValueAndValidity()
      }
    }
  }

  errorMessage(field: any, inputName: any) {
    this.common_service.displayWarning(`Please select valid ${field}`)
    this.modify_form.get(`${inputName}`)?.setValue('')
  }

  removeworkOrder(item: any) {
    const index = this.workOrderList.indexOf(item);
    if (index !== -1) {
      this.workOrderList.splice(index, 1);
    }
  }

  submit_response: any
  Is_spinner: boolean = false
  modify_detail_submit() {

    if (this.modify_form.valid) {

      if (this.modify_form.get('duration')?.value === 0) {
        this.common_service.displayWarning('Duration must be greater than 0.');
        return;
      }

      const selectedType = this.modify_form.get('Select_Charge_Code_or_Work_Order')?.value;
      if (selectedType === 'chargeCode' && this.chargeCodeList.length === 0) {
        this.common_service.displayWarning('At least one Charge Code is required.');
        return;
      }
      if (selectedType !== 'chargeCode' && this.workOrderList.length === 0) {
        this.common_service.displayWarning('At least one Work Order is required.');
        return;
      }

      this.Is_spinner = true
      const body = {
        workId: this.modify_form.get('work_id')?.value,
        TaskId: this.modify_form.get('task_id')?.value,
        description: this.modify_form.get('description')?.value,
        location: this.modify_form.get('location')?.value,
        resource: this.modify_form.get('resources')?.value,
        charge_Code: '',
        charge_Codes: this.modify_form.get('Select_Charge_Code_or_Work_Order')?.value === 'chargeCode' ? this.chargeCodeList : [],
        activityCode: this.modify_form.get('activityCode')?.value || '',
        work_Orders: this.modify_form.get('Select_Charge_Code_or_Work_Order')?.value != 'chargeCode' ? this.workOrderList : [],
        duration: Number(this.modify_form.get('duration')?.value),
        actionType: this.is_new === 'complete_draft_request' ? 'complete_draft_request' : 'Modify Test Details',
        lithiumBattery: this.modify_form.get('lithium_batteries')?.value === true ? true : false,
        lithiumBatteryDescription: this.modify_form.get('lithium_batteries_description')?.value,
        radiation: this.modify_form.get('Radiation')?.value === true ? true : false,
        radiationDescription: this.modify_form.get('Radiation_description')?.value,
        Reason: '',
        userID: this.user_id,
      }

      this.api_service.modify_test_request(body).subscribe({

        next: (res) => {
          this.submit_response = res
          if (this.submit_response.status) {

            if (this.modify_form.get('duration')?.value != this.task_data.daysRequested) {

              this.Is_spinner = false
              this.common_service.displaySuccess('Modified Details Submitted Sucessfully')
              this.dialogRef.close('submitted')

              const data = {
                user_id: this.user_id,
                wRnumber: this.modify_form.get('work_id')?.value,
                taskNumber: this.modify_form.get('task_id')?.value,
                duration: this.modify_form.get('duration')?.value,
                location: this.modify_form.get('location')?.value,
                resource: this.modify_form.get('resources')?.value,
              };
              this.local_storage.setDataFormCalender(data);
              this.router.navigate([`calendar`, this.modify_form.get('work_id')?.value, this.modify_form.get('task_id')?.value],
                {
                  state: { message: 'Update' }
                });
              this.modify_form.reset()
            } else {
              this.Is_spinner = false
              this.common_service.displaySuccess('Modified Details Submitted Sucessfully')
              this.dialogRef.close('submitted')
              this.modify_form.reset()
            }

          } else {
            this.common_service.displayWarning('Request fail to modify task details. Please try again')
            this.Is_spinner = false
          }

        },
        error: (err) => {
          this.Is_spinner = false;
          console.error('API error:', err);
          this.common_service.displayWarning('Request fail to modify task details. Please try again');
        },
      })
    } else {
      this.modify_form.markAllAsTouched()
      this.common_service.displayWarning('Please fill required fields');
    }
  }

  close() {
    this.dialogRef.close()
    this.modify_form.reset()
  }

  input_location() {
    this.modify_form.get('location')?.value.length === 0 ? this.resourcesOptions = [] : ''
  }

}

// cancel_change_to_draft 
@Component({
  selector: 'cancel_change_to_draft',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="container-fluid common_dialog">
    <div class="row">
      <div class="col-12" *ngIf="task_action_type === 'cancel'">
        <h2>Test Cancellation</h2>

        <form autocomplete="off">
          <h5 class="text-danger" style="font-size:0.75em">Test will be cancelled, continue?</h5>
        <label class="mt-2" for="reason">Reason for cancellng:</label>
        <textarea  [ngModelOptions]="{standalone: true}" [(ngModel)]="reason" placeholder="Reason for cancellng" rows="5" cols="40"></textarea>
        <div class="btn_div"> 
        <button class="yesbtn" (click)="cancel_task()"  *ngIf="!Is_spinner">Cancel Request</button>
         <button class="yesbtn" *ngIf="Is_spinner">
            <div class="spinner"></div>
         </button>
        <button (click)="close()">Cancel</button>
        </div>
        </form>

      </div>

      <div class="col-12" *ngIf="task_action_type === 'draft'">
        <h2>Confirm Request to Draft</h2>

        <form autocomplete="off">
          <h5 class="text-danger" style="font-size:0.75em">**Test will be cancelled from schedule, continue?</h5>
        <label class="mt-2" for="reason">Reason for change to Draft:</label>
        <textarea  [ngModelOptions]="{standalone: true}" [(ngModel)]="reason" placeholder="Reason for change to Draft" rows="5" cols="40"></textarea>
        <div class="btn_div"> 
        <button class="yesbtn" (click)="draft_task()"  *ngIf="!Is_spinner">Change to Draft</button>
        <button class="yesbtn" *ngIf="Is_spinner">
            <div class="spinner"></div>
        </button>
        <button (click)="close()">Cancel</button>
        </div>
        </form>
      </div>

      <div class="col-12" *ngIf="task_action_type === 'Approval Pending'">
        <h2 style="font-size: 0.8em;">Please click 'Yes' to approve the task request <strong style="color:green;">{{taskId}}</strong> </h2>
        <form autocomplete="off">
          <!-- <textarea  [ngModelOptions]="{standalone: true}" [(ngModel)]="reason" placeholder="Comment" rows="5" cols="40">

          </textarea> -->
        <div class="btn_div"> 
        <!-- <button class="btn btn-warning me-2" type="button" (click)="approve_task('Tentative')"  *ngIf="!Is_spinner">Tentative</button> -->
        <button class="yesbtn me-2" type="button" style="width:60px;" (click)="approve_task('Approved')"  *ngIf="!Is_spinner">Yes</button>
        <!-- <button class="yesbtn" type="button" (click)="approve_task('Reject')"  *ngIf="!Is_spinner">Reject</button> -->
        <button class="yesbtn"  *ngIf="Is_spinner">
            <div class="spinner"></div>
        </button>
        <button type="button" style="width:60px;" (click)="close()">No</button>
        </div>
        </form>
      </div>

    </div>
  </div>
  `,
  styleUrl: './task-request-detail.component.scss'
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
    this.user_id = data.user_id;
    this.task_action_type = data.value;
    this.word_id = data.word_id;
    this.taskId = data.taskId;
  }

  reason: string = ''
  submit_response: any
  Is_spinner: boolean = false
  cancel_task() {

    if (this.reason != "") {
      this.Is_spinner = true
      const body = {
        UserID: this.user_id,
        workId: this.word_id,
        taskId: this.taskId,
        description: '',
        test_Contacts: '',
        resource: '',
        duration: 0,
        actionType: 'Cancel Test',
        Reason: this.reason
      }

      this.api_service.modify_test_request(body).subscribe({
        next: (res) => {

          this.submit_response = res
          if (this.submit_response.status) {
            this.Is_spinner = false
            this.common_service.displaySuccess('Task cancellation request submitted successfully with reason included.')
            this.dialogRef.close('submitted')
            this.reason != ""
          } else {
            this.Is_spinner = false
            this.common_service.displayWarning('Request failed for cancellation. Please try again')
          }
        },
        error: (err) => {
          this.Is_spinner = false;
          console.error('API error:', err);
          this.common_service.displayWarning('Request failed for cancellation. Please try again');
        },
      })
    } else {
      this.common_service.displayWarning('Please provide a Reason before submitting.');
    }
  }

  draft_task() {

    if (this.reason != "") {
      this.Is_spinner = true
      const body = {
        UserID: this.user_id,
        workId: this.word_id,
        taskId: this.taskId,
        description: '',
        test_Contacts: '',
        resource: '',
        duration: 0,
        actionType: 'Change to Draft',
        Reason: this.reason
      }

      this.api_service.modify_test_request(body).subscribe({

        next: (res) => {

          this.submit_response = res
          if (this.submit_response.status) {
            this.Is_spinner = false
            this.common_service.displaySuccess('Request to change task status to draft submitted successfully with reason included.')
            this.dialogRef.close('submitted')
            this.reason != ""
          } else {
            this.Is_spinner = false
            this.common_service.displayWarning('Request failed to change task status to draft. Please try again')
          }
        },
        error: (err) => {
          this.Is_spinner = false;
          console.error('API error:', err);
          this.common_service.displayWarning('Request failed to change task status to draft. Please try again');
        },
      })
    } else {
      this.common_service.displayWarning('Please provide a Reason before submitting.');
    }
  }

  approve_task(approval_type: any) {

    this.Is_spinner = true
    const body = {
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
          this.dialogRef.close('submitted for approval')
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

    // if (this.reason != "") {
    //   this.Is_spinner = true
    //   const body = {
    //     UserID: this.user_id,
    //     workId: this.word_id,
    //     taskId: this.taskId,
    //     actionType: approval_type,
    //     Reason: this.reason
    //   }

    //   this.api_service.modify_test_request(body).subscribe({

    //     next: (res) => {

    //       this.submit_response = res
    //       if (this.submit_response.status) {
    //         this.Is_spinner = false
    //         this.common_service.displaySuccess('Submitted Sucessfully')
    //         this.dialogRef.close('submitted')
    //         this.reason != ""
    //       } else {
    //         this.Is_spinner = false
    //         this.common_service.displayWarning('Request failed. Please try again later')
    //       }
    //     },
    //     error: (err) => {
    //       this.Is_spinner = false;
    //       console.error('API error:', err);
    //       this.common_service.displayWarning('Request failed. Please try again later');
    //     },
    //   })
    // } else {
    //   this.common_service.displayWarning('Please provide a Reason before submitting.');
    // }
  }

  close() {
    this.dialogRef.close()
  }

}

// File 
@Component({
  selector: 'upload_file',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="container-fluid common_dialog">
    <div class="row">
      <div class="col-12">
        <h2>Add File to Task</h2>

        <form autocomplete="off">
        <label for="upload">Upload File:</label>
        <input type="file" id="upload" (change)="onFileChange($event)" />

        <label class="mt-2" for="description">Description:</label>
        <input type="text" id="description" [ngModelOptions]="{standalone: true}" [(ngModel)]="description" placeholder="Description">
        <div class="btn_div">
         <button class="yesbtn"  *ngIf="!Is_spinner" (click)="add_file()">Upload</button>
         <button class="yesbtn" *ngIf="Is_spinner">
            <div class="spinner"></div>
         </button>
        <button (click)="close()" *ngIf="!Is_spinner">Cancel</button>
        </div>
        </form>
      </div>
    </div>
  </div>
  `,
  styleUrl: './task-request-detail.component.scss'
})

export class upload_file {
  taskId: any;
  user_id: any;
  constructor(public dialogRef: MatDialogRef<upload_file>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private apiservice: AllApiServiceService,
    private common_service: CommonServiceService) {
    this.user_id = data.user_id;
    this.taskId = data.taskId;
  }

  description: string = '';
  file!: File;
  fileBase64: string = '';
  Is_spinner: boolean = false;

  onFileChange(event: any): void {
    const target = event.target as HTMLInputElement;
    if (target.files?.length) {
      this.file = target.files[0];
      this.convertToBase64(this.file);
    }
  }

  checkfile: any
  associate: Boolean = false
  convertToBase64(file: File) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.fileBase64 = reader.result as string;

      const formData = {
        UserID: this.user_id,
        TaskID: this.taskId,
        FileName: this.file.name,
        file: this.fileBase64,
        Description: '',
        associate: false
      };

      this.apiservice.add_file_task(formData).subscribe({
        next: (res) => {
          this.checkfile = res
          if (this.checkfile.responseMessage.includes("A file with the same name already exists")) {
            Swal.fire({
              title: 'File Already Exists',
              text: this.checkfile.responseMessage,
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Yes, Continue',
              cancelButtonText: 'No, Cancel'
            }).then(result => {
              if (result.isConfirmed) {
                this.associate = true;
              } else {
                this.file = null as unknown as File;
                this.fileBase64 = '';
                const fileInput = document.getElementById('fileInput') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
              }
            });
          }
        },
        error: (err) => {
          this.Is_spinner = false;
          console.error('API error:', err);
          this.common_service.displayWarning('Failed to add file. Please try again.');
        }
      });

    };
    reader.onerror = (error) => {
      console.error('File read error:', error);
      this.common_service.displayWarning('Failed to read file.');
      this.fileBase64 = '';
    };

  }

  api_res: any
  add_file() {
    if (!this.fileBase64) {
      this.common_service.displayWarning('Please select a file.');
      return;
    }
    if (!this.description.trim()) {
      this.common_service.displayWarning('Please enter a description.');
      return;
    }

    this.Is_spinner = true;

    const formData = {
      UserID: this.user_id,
      TaskID: this.taskId,
      FileName: this.file.name,
      file: this.fileBase64,
      Description: this.description,
      associate: this.associate
    };

    this.apiservice.add_file_task(formData).subscribe({
      next: (res) => {
        this.Is_spinner = false;
        this.api_res = res
        if (res) {
          this.common_service.displaySuccess(this.api_res.responseMessage);
          this.dialogRef.close('submitted');
        } else {
          this.common_service.displayWarning('Failed to add file. Please try again.');
        }
      },
      error: (err) => {
        this.Is_spinner = false;
        console.error('API error:', err);
        this.common_service.displayWarning('Failed to add file. Please try again.');
      }
    });
  }

  close() {
    this.dialogRef.close()
  }

}

// Link 
@Component({
  selector: 'add_link',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="container-fluid common_dialog">
    <div class="row">
      <div class="col-12">
        <h2>Add Link to Task</h2>

        <form autocomplete="off">
        <label for="link">Add Link:</label>
        <input type="text" id="link" [ngModelOptions]="{standalone: true}" [(ngModel)]="link"/>
        
        <label class="mt-2" for="description">Description:</label>
        <input type="text" id="description" [ngModelOptions]="{standalone: true}" [(ngModel)]="description" placeholder="Description">
        <div class="btn_div"> 
         <button class="yesbtn"  *ngIf="!Is_spinner" (click)="add_link()">Add Link</button>
         <button class="yesbtn" *ngIf="Is_spinner">
            <div class="spinner"></div>
         </button>
        <button (click)="close()" *ngIf="!Is_spinner">Cancel</button>
        </div>
        </form>
      </div>
    </div>
  </div>
  `,
  styleUrl: './task-request-detail.component.scss'
})

export class add_link {

  user_id: any
  constructor(public dialogRef: MatDialogRef<add_link>,
    private apiservice: AllApiServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private common_service: CommonServiceService) {
    this.user_id = data.user_id;
    this.taskId = data.taskId;
  }

  link: string = '';
  description: string = ''
  taskId: any;
  Is_spinner: boolean = false
  add_link() {
    if (this.link != "" && this.description != "") {
      const body = {
        userID: this.user_id,
        taskID: this.taskId,
        link: this.link,
        description: this.description
      }

      this.apiservice.add_link_task(body).subscribe({
        next: (res) => {
          if (res) {
            this.Is_spinner = false
            this.common_service.displaySuccess('Link to Task has been added successfully. ');
            this.dialogRef.close('submitted')
          } else {
            this.Is_spinner = false
            this.common_service.displayWarning('Request failed to add Link to Task. Please try again')
          }
        },
        error: (err) => {
          this.Is_spinner = false;
          console.error('API error:', err);
          this.common_service.displayWarning('Request failed to add Link to Task. Please try again');
        },
      })
    } else {
      this.common_service.displayWarning('Please add Link and Description to Task first.');
    }
  }

  close() {
    this.dialogRef.close()
  }

}

// Contact 
@Component({
  selector: 'add_contact',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="container-fluid common_dialog">
    <div class="row">
      <div class="col-12">
        <h2>Add Contact to Task</h2>

        <form autocomplete="off">
        <label for="contact">Select Contact:</label>
        <select id="contact" (change)="selected_value($event)" style="width:270px !important">
      <option value="">Select a contact</option>
      <option *ngFor="let contact of contactOptions" [value]="contact.userId">
        {{ contact.userName }} / {{contact.userId}}
      </option>
    </select>
        <div class="btn_div">
        <button class="yesbtn"  *ngIf="!Is_spinner" (click)="add_contact()">Submit Contact</button>
         <button class="yesbtn" *ngIf="Is_spinner">
            <div class="spinner"></div>
         </button>
        <button (click)="close()" *ngIf="!Is_spinner">Cancel</button>
        </div>
        </form>
      </div>
    </div>
  </div>
  `,
  styleUrl: './task-request-detail.component.scss'
})

export class add_contact {
  contactOptions: any
  taskId: any
  constructor(public dialogRef: MatDialogRef<add_contact>,
    private apiservice: AllApiServiceService,
    private common_service: CommonServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.taskId = data.taskId
  }


  ngOnInit(): void {
    this.get_allUser_taskPage()
  }

  get_allUser_taskPage() {
    this.apiservice.task_detail_allUser_modal_get().subscribe({
      next: (res) => {
        this.contactOptions = res
      },
      error: (err) => {

      }
    })
  }

  selected_contact: any
  selected_value(event: any) {
    const selectedContactId = event.target.value
    const selectedContact = this.contactOptions.find((contact: { userId: any; }) => contact.userId === selectedContactId);
    if (selectedContact) {
      this.selected_contact = selectedContact
    }
  }

  Is_spinner: boolean = false
  submit_response: any
  add_contact() {
    if (this.selected_contact) {
      this.Is_spinner = true
      const body = {
        userId: this.selected_contact.userId,
        taskNumber: this.taskId
      }

      this.apiservice.assignUser_taskDetail(body).subscribe({
        next: (res) => {
          this.submit_response = res
          if (this.submit_response.status) {
            this.Is_spinner = false
            this.common_service.displaySuccess(this.submit_response.responseMessage)
            this.dialogRef.close('submitted')
            this.selected_contact = ""
          } else {
            this.Is_spinner = false
            this.common_service.displayWarning('Request failed to add Contact. Please try again')
          }
        },
        error: (err) => {
          this.Is_spinner = false;
          console.error('API error:', err);
          this.common_service.displayWarning('Request failed to add Contact. Please try again');
        },
      })
    } else {
      this.common_service.displayWarning('Please select Contact first.');
    }
  }

  close() {
    this.dialogRef.close()
  }

}

// Log Entries
@Component({
  selector: 'add_log_entries',
  imports: [CommonModule, FormsModule,],
  template: `
  <div class="container-fluid common_dialog">
    <div class="row">
      <div class="col-12">
        <h2>Add Entry to Log</h2>

        <form autocomplete="off">
        <label for="time">Time:</label>
        <input type="datetime-local" id="time" (change)="onDateChange($event)">
        <!-- <input type="text" id="link" [ngModelOptions]="{standalone: true}" [(ngModel)]="link"/> -->
        
        <label class="mt-2" for="description">Comment:</label>
        <textarea id="description" [ngModelOptions]="{standalone: true}" [(ngModel)]="description"></textarea>
        <div class="btn_div"> 
        <button class="yesbtn" (click)="create_entry()" *ngIf="!Is_spinner">Create Entry</button>
        <button class="yesbtn" *ngIf="Is_spinner">
            <div class="spinner"></div>
         </button>
        <button (click)="close()" *ngIf="!Is_spinner">Cancel</button>
        </div>
        </form>
      </div>
    </div>
  </div>
  `,
  styleUrl: './task-request-detail.component.scss',
  providers: [DatePipe],
})

export class add_log_entries {
  taskId: any
  workId: any
  user_id: any
  displayName: any
  constructor(public dialogRef: MatDialogRef<add_log_entries>,
    private datePipe: DatePipe,
    private apiservice: AllApiServiceService,
    private common_service: CommonServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.user_id = data.user_id;
    this.displayName = data.displayName;
    this.workId = data.workId
    this.taskId = data.taskId
  }

  date: any;
  description: string = ''
  onDateChange(event: any): void {
    const date = new Date(event.target.value);
    this.date = date
  }

  Is_spinner: boolean = false
  create_entry() {
    if (this.date != "" && this.description != "") {

      this.Is_spinner = true
      const body = {
        wRnumber: this.workId,
        taskNumber: this.taskId,
        timestamp: this.date,
        comment: this.description,
        userID: this.user_id,
        userName: this.displayName
      }

      this.apiservice.addlog_taskDetail(body).subscribe({
        next: (res) => {
          if (res) {
            this.Is_spinner = false
            this.common_service.displaySuccess('Log Entry to Task has been added successfully.');
            this.dialogRef.close('submitted')
          } else {
            this.Is_spinner = false
            this.common_service.displayWarning('Request failed to add Log Entry. Please try again')
          }
        },
        error: (err) => {
          this.Is_spinner = false;
          console.error('API error:', err);
          this.common_service.displayWarning('Request failed to add Log Entry. Please try again');
        },
      })

    } else {
      this.common_service.displayWarning('Please select Date Time and add Comment to Task first.');
    }
  }

  close() {
    this.dialogRef.close()
  }

}

// Delete

@Component({
  selector: 'delete_request',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="container-fluid delete_modal">
    <div class="row">
      <div class="col-12">
        <h2>Delete Confirmation</h2>
        <form autocomplete="off">
        <label>Are you sure you want to delete {{delete_type}}: <strong>{{name}}</strong>? <br> This action cannot be undone.</label>
        <div class="btn_div">
        <button class="yesbtn" (click)="delete_Request()" *ngIf="!Is_spinner">Yes, Delete</button>
        <button class="yesbtn" *ngIf="Is_spinner">
          <div class="spinner"></div>
        </button>
        <button (click)="close()">Cancel</button>
        </div>
        </form>
      </div>
    </div>
  </div>
  `,
  styleUrl: './task-request-detail.component.scss',
})

export class delete_request {
  delete_type: any
  name: any
  taskId: any
  user_id: any
  constructor(public dialogRef: MatDialogRef<delete_request>,
    private apiservice: AllApiServiceService,
    private common_service: CommonServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.delete_type = data.delete_type
    this.user_id = data.user_id;
    this.name = data.name
    this.taskId = data.taskId
  }

  close() {
    this.dialogRef.close()
    this.name = ''
    this.delete_type = ''
  }

  Is_spinner: boolean = false;
  delete_Request() {
    this.delete_type === 'Contact' ? this.delete_contact() :
      this.delete_type === 'File' ? this.delete_file() :
        this.delete_type === 'Link' ? this.delete_link() : '';
  }

  delete_contact() {
    this.Is_spinner = true;
    const body = {
      "taskID": this.taskId,
      "userID": this.name
    }
    this.apiservice.delete_contact_task(body).subscribe({
      next: (res) => {
        this.Is_spinner = false;
        this.common_service.displaySuccess('Contact deleted successfully.');
        this.dialogRef.close();
      }, error: (err) => {
        this.Is_spinner = false;
        this.common_service.displayWarning('Failed to delete contact. Please try again.');
      }
    })
  }

  delete_file() {
    this.Is_spinner = true;
    const body = {
      userID: this.user_id,
      taskID: this.taskId,
      fileName: this.name
    }
    this.apiservice.delete_file_task(body).subscribe({
      next: (res) => {
        this.Is_spinner = false;
        this.common_service.displaySuccess('File deleted successfully.');
        this.dialogRef.close();
      }, error: (err) => {
        this.Is_spinner = false;
        this.common_service.displayWarning('Failed to delete file. Please try again.');
      }
    })
  }

  delete_link() {
    this.Is_spinner = true;
    const body = {
      userID: this.user_id,
      taskID: this.taskId,
      link: this.name
    }
    this.apiservice.delete_link_task(body).subscribe({
      next: (res) => {
        this.Is_spinner = false;
        this.common_service.displaySuccess('Link deleted successfully.');
        this.dialogRef.close();
      }, error: (err) => {
        this.Is_spinner = false;
        this.common_service.displayWarning('Failed to delete link. Please try again.');
      }
    })
  }

}