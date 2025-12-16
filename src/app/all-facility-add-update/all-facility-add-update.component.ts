import { Component, ElementRef, HostListener, Inject, NgZone, ViewChild } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { NgxPaginationModule } from 'ngx-pagination';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog"
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AllApiServiceService } from '../Services/all-api-service.service';
import { CommonServiceService } from '../Services/common-service.service';

@Component({
  selector: 'app-all-facility-add-update',
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './all-facility-add-update.component.html',
  styleUrl: './all-facility-add-update.component.scss'
})

export class AllFacilityAddUpdateComponent {

  page = 1;
  itemsPerPage: number = 25;
  private pollingInterval: any = null;
  searchText: any;
  constructor(private titleService: Title,
    private api_service: AllApiServiceService,
    private ngZone: NgZone,
    public dialog: MatDialog) {
    this.titleService.setTitle('Add/Update All Facilities | MTL HALLIBURTON');
  }

  ngOnInit(): void {
    this.startPolling()
  }

  startPolling() {
    this.Get_all_facility()
    this.ngZone.runOutsideAngular(() => {
      this.pollingInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.Get_all_facility()
        })
      }, 5000)
    })
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
      console.log('Component destroyed. Polling stopped.');
    }
  }


  isLoading: boolean = true;
  all_facility: any = []
  Get_all_facility() {
    this.api_service.Get_all_facility().subscribe({
      next: (res: any) => {
        this.all_facility = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching tasks:', err);
        this.isLoading = false;
      }
    });
  }

  get filteredItems() {
    if (!this.searchText) {
      return this.all_facility;
    }
    const search = this.searchText.toLowerCase();
    return this.all_facility.filter((item: any) =>
       Object.values(item)
        .some((value: any) => {
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(search);
      })
    );
  }

  Is_spinner: boolean = false
  add_update(action_type: any, facility_id: any) {
    if (action_type === 'Update Facility') {
      this.Is_spinner = true
    } else {
      this.isLoading = true
    }
      this.pollingInterval = null

    this.api_service.Get_all_resource_dropdown().subscribe({
      next: (res: any) => {
        this.Is_spinner = false
        this.isLoading = false
        const dialogRef = this.dialog.open(facility, {
          data: { action_type: action_type, data: res, facility_id: action_type === 'Update Facility' ? facility_id : '' },
          width: '590px',
          panelClass: 'custom-dialog-container',
          disableClose: true
        })

        dialogRef.afterClosed().subscribe(result => {
          this.Is_spinner = false
          this.isLoading = true
          this.startPolling()
        });

      },
      error: (err) => {
        this.Is_spinner = false
        console.error('Error fetching tasks:', err);
        this.isLoading = false;
      }
    })
  }

  view_allManagementUser(list: any) {
    this.isLoading = false;
    const scheduleDialogRef = this.dialog.open(management_user_list, {
      data: {
        user_list: list
      },
      width: '400px',
      panelClass: 'custom-dialog-container'
    });
  }

  viewCalibrationsettings(facility_id: any) {
    const dialogRef = this.dialog.open(calibration_details, {
          data: {facility_id : facility_id },
          width: '590px',
          panelClass: 'custom-dialog-container',
        })
  }

  delete_facility(facility: any, facilityID: any) {
    const dialogRef = this.dialog.open(delete_facility, {
      data: {
        facility: facility,
        facilityID: facilityID
      },
      width: '300px',
      panelClass: 'custom-dialog-container'
    })

    dialogRef.afterClosed().subscribe(result => {
      this.isLoading = true
      this.startPolling()
    })
  }

}


// Facility

@Component({
  selector: 'facility',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  template: `
  <div class="container-fluid common_dialog" style="padding: 0 !important;">
    <div class="row">
        <div class="col-12">
            <h2>{{this.action_type === 'Update Facility' ? 'Update Facility' : 'Add New Facility'}}</h2>

            <form [formGroup]="facility_form" (ngSubmit)="onSubmit()">
                <div class="scroll">
                    <div class="form-group">
                        <div class="form_field">
                            <label for="facility">Facility: </label>
                            <input type="text" id="facility" class="form-control " placeholder="Facility Name"
                                formControlName="facility">
                        </div>
                        <div *ngIf="facility_form.get('facility')?.invalid && facility_form.get('facility')?.touched"
                            class="text-danger error">
                            Facility are required.
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <div class="form_field">
                            <label for="discription">Discription:</label>
                            <input type="text" placeholder="Write Long Discription" id="discription"
                                class="form-control" formControlName="discription" />
                        </div>
                        <div *ngIf="facility_form.get('discription')?.invalid && facility_form.get('discription')?.touched"
                            class="text-danger error">
                            Discription is required.
                        </div>
                    </div>

                    <div class="form-group">
                     <div class="form_field_dropdown">
                          <label for="user_id_management">Management Users:</label>
                            <input id="user_id_management" type="text" class="form-control" placeholder="Search User"
                                formControlName="user_id_management" (click)="show()"
                                (input)="filteredAutocomplete($event)" #inputField>
                            <ul *ngIf="filteredUsers?.length !== 0" class="list_drop" #dropdownContainer>
                                <li *ngFor="let option of filteredUsers" (click)="selectOption(option)">
                                    {{ option }}
                                </li>
                            </ul>
                        </div>

                        <div class="row">
                            <div class="key-description col-2" *ngFor="let item of managementuserList">
                                <i class="bi bi-x-circle-fill" (click)="removemanagementUser(item)"></i>
                                {{item}}
                            </div>
                        </div>
                    <div *ngIf="managementuserList?.length === 0" class="text-danger error">
                        Atleast one management user is required.
                    </div>
                    </div>

                    <div class="form-group p-1">
                        <div class="form_field">
                            <label for="link">Facility Policy Link:</label>
                            <div class="border d-flex" style="justify-content: space-around;">
                                <div>
                                    <label>
                                        <input type="radio" class="mx-1" formControlName="link_or_file" value="link">
                                        Add Link
                                    </label>
                                </div>

                                <div>
                                    <label>
                                        <input type="radio" class="mx-1" formControlName="link_or_file" value="file">
                                        Attach File
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div *ngIf="facility_form.get('link_or_file')?.invalid && facility_form.get('link_or_file')?.touched"
                            class="text-danger error">
                            <div *ngIf="facility_form.get('link_or_file')?.hasError('required')">
                                Please select either a link or a file.
                            </div>
                        </div>

                        <div class="form_field" *ngIf="facility_form.get('link_or_file')?.value === 'link'">
                            <label for="">Add Link:</label>
                            <input type="text" placeholder="Add Facility Policy Link" class="form-control"
                                formControlName="link" />
                            <div *ngIf="facility_form.get('link')?.invalid && facility_form.get('link')?.touched"
                                class="text-danger error">
                                Link is required.
                            </div>
                        </div>
                        <div class="form_field" *ngIf="facility_form.get('link_or_file')?.value === 'file'">
                            <label for="">Attach File:</label>
                            <input type="file" placeholder="Add Facility Policy File" class="form-control"
                                formControlName="file" />
                            <div *ngIf="facility_form.get('file')?.invalid && facility_form.get('file')?.touched"
                                class="text-danger error">
                                File is required.
                            </div>
                        </div>

                    </div>

                    <div class="form-group" *ngIf="facility_form.get('link_or_file')?.value === 'file'">
                        <div class="form_field">
                            <label for="file_access">File Access:</label>

                            <select id="file_access" class="form-control form-select" formControlName="file_access">
                                <option selected value="Everyone">Everyone</option>
                                <option value="Admin">Admin</option>
                            </select>

                            <div *ngIf="facility_form.get('file_access')?.invalid && facility_form.get('file_access')?.touched"
                                class="text-danger error">
                                <div *ngIf="facility_form.get('file_access')?.hasError('required')">
                                    Please select who can access the file.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="form-group border">
                        <div class="form_field">
                            <label for="policy_checkbox">
                                <input type="checkbox" id="policy_checkbox" class="form-control"
                                    formControlName="policy_checkbox" class="me-1 mx-1">
                                User must agree to Facility Policy before Scheduling
                            </label>
                            <div *ngIf="facility_form.get('policy_checkbox')?.invalid && facility_form.get('policy_checkbox')?.touched"
                                class="text-danger error">
                                <div *ngIf="facility_form.get('policy_checkbox')?.hasError('required')">
                                    Please check the box to agree to the Facility Policy before scheduling.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="border p-1 pt-0 mt-2">
                        <h5>Calibration Setting(If Applicable)</h5>

                        <div class="form-group" style="width: max-content;">
                                <div class="form_field">
                                    <label for="mail_notification">Email Notifications Enabled:
                                        <input type="checkbox" id="mail_notification" class="form-control"
                                            formControlName="mail_notification" class="mx-2">
                                    </label>
                                </div>
                            </div>
                            <div class="form-group">
                                <div class="form_field" style="flex-direction: row;">
                                    <label for="contact"  style="width: 30.3%;">Contact:</label>
                                    <select id="contact" class="form-control form-select mx-2"
                                            formControlName="contact">
                                            <option selected value="Not Required">Not Required</option>
                                            <option *ngFor="let option of userlistOptions" [value]="option">{{ option }}</option>
                                        </select>
                                </div>

                            </div>
              
                       <div class="form-group">
                                <div class="form_field" style="flex-direction: row;">
                                    <label for="furture_check" style="width: 40%;" >Furture Check (Days):</label>
                                      <input type="number" id="furture_check" class="form-control mx-3"
                                          formControlName="furture_check">
                                </div>
                            </div>

                            <div class="form-group">
                                <div class="form_field" style="flex-direction: row;">
                                    <label for="interval_to_check" style="width: 40%;">Interval To Check (Days):</label>
                                      <input type="number" id="interval_to_check" class="form-control mx-3"
                                          formControlName="interval_to_check">
                                </div>
                            </div>
                    </div>
                </div>

                <div class="btn_div">
                    <button class="yesbtn" type="button" (click)="onSubmit()" *ngIf="!Is_spinner">
                     {{this.action_type === 'Update Facility' ? 'Update Facility' : 'Add Facility'}}  
                    </button>
                    <button type="button" class="yesbtn" *ngIf="Is_spinner">
                        <div class="spinner"></div>
                    </button>
                    <button (click)="close()" type="reset">Close</button>
                </div>
            </form>
        </div>
    </div>
</div>
  `,
  styleUrl: './all-facility-add-update.component.scss'
})

export class facility {
  facility_form !: FormGroup
  action_type: any
  facility_id: any
  dropdownData: any
  userlistOptions: string[] = [];
  managementuserList: string[] = [];
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
      this.filteredUsers = [];
    }
  }

  constructor(
    private api_service: AllApiServiceService,
    public common_service: CommonServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<facility>,
    public fb: FormBuilder) {
    this.action_type = data.action_type
    this.dropdownData = data?.data
    this.userlistOptions = this.dropdownData?.users
    
    this.facility_form = this.fb.group({
      facility: ['', Validators.required],
      discription: ['', Validators.required],
      user_id_management: [''],
      link_or_file: ['', Validators.required],
      link: [''],
      file: [''],
      file_access: ['Everyone'],
      policy_checkbox: [false, Validators.required],
      contact: ['Not Required'],
      mail_notification: [false],
      furture_check: [''],
      interval_to_check: [''],
    });

    this.facility_form.get('link_or_file')?.valueChanges.subscribe((value) => {
      const linkControl = this.facility_form.get('link');
      const fileControl = this.facility_form.get('file');
      const fileAccess = this.facility_form.get('file_access');

      if (value === 'link') {
        linkControl?.setValidators([Validators.required]);
        fileControl?.setValue('');
        fileAccess?.setValue('Everyone');
        fileControl?.clearValidators();
        fileAccess?.clearValidators();
      }
      else if (value === 'file') {
        linkControl?.setValue('');
        fileControl?.setValidators([Validators.required]);
        fileAccess?.setValidators([Validators.required]);
        linkControl?.clearValidators();
      }

      linkControl?.updateValueAndValidity();
      fileControl?.updateValueAndValidity();
      fileAccess?.updateValueAndValidity();
    });

    if (this.action_type != 'Add Facility') {
      this.facility_id = data.facility_id
      this.get_Facility_details(this.facility_id)
    }

  }

  facility_details: any
  get_Facility_details(facility_id:any){
     this.api_service.get_Facility_details(facility_id).subscribe({
       next: (res: any) => {
         this.facility_details = res[0]
         this.managementuserList = this.facility_details.managementUserIDs != null ? this.facility_details.managementUserIDs?.split(',') : [];

         this.facility_form.patchValue({
           facility: this.facility_details?.facility,
           discription: this.facility_details?.longDescription,
           link: this.facility_details?.facilityPolicyLink,
           file: this.facility_details?.longDescription,
           file_access: this.facility_details?.fileAccess,
           policy_checkbox: this.facility_details?.agreementRequired,
           contact: this.facility_details?.contactName,
           mail_notification: this.facility_details?.emailNotification,
           furture_check: this.facility_details?.futureCheck,
           interval_to_check: this.facility_details?.interval,
         });
          if(this.facility_details?.facilityPolicyLink !== ''){
            this.facility_form.get('link_or_file')?.setValue('link')
          }else{
            this.facility_form.get('link_or_file')?.setValue('file')
          }
       },
      
      error: (err) => {
        console.error('Error fetching tasks:', err);
      }
    });
  }

  filteredUsers: string[] = [];
  show(): void {
    this.filteredUsers = [...this.userlistOptions];
  }

  filteredAutocomplete(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    if (input) {
      this.filteredUsers = this.userlistOptions.filter((item: string) =>
        item.toLowerCase().includes(input.toLowerCase())
      );
      this.filteredUsers = this.filteredUsers.length > 0 ? this.filteredUsers : ['No data with this search'];
    } else {
      this.filteredUsers = [...this.userlistOptions];
    }
  }

  removemanagementUser(item: any) {
    const index = this.managementuserList.indexOf(item);
    if (index !== -1) {
      this.managementuserList.splice(index, 1);
    }
  }

selectOption(option: string): void {
  if (!option || option === 'No data with this search') {
    this.facility_form.get('user_id_management')?.setValue('');
    this.filteredUsers = [];
    return;
  }
  if (!this.managementuserList?.includes(option)) {
    this.managementuserList.push(option);
  } else {
    this.common_service.displayWarning('User already exists');
  }
  this.facility_form.get('user_id_management')?.setValue('');
  this.filteredUsers = [];
}

  close() {
    this.dialogRef.close()
  }

  onSubmit() {
    if (this.facility_form.valid) {
      if (this.managementuserList.length === 0) {
        this.common_service.displayWarning('Atleast one management user is required.')
        return
      }
      this.Is_spinner =  true
      const managementuserList = this.managementuserList.join(', ')
      const body = {
        "facilityID": this.action_type === 'Update Facility' ? Number(this.facility_id) : 0,
        "facility": this.facility_form.get('facility')?.value,
        "longDescription": this.facility_form.get('discription')?.value,
        "managementUserIDs": managementuserList,
        "fileAccess":  this.facility_form.get('link_or_file')?.value === 'file' ? this.facility_form.get('file_access')?.value : '',
        "facilityPolicyLink": this.facility_form.get('link')?.value,
        // "facilityPolicyFile":  this.facility_form.get('file')?.value ,
        "agreementRequired": this.facility_form.get('policy_checkbox')?.value,
        "contactID": '',
        "contactName": this.facility_form.get('contact')?.value,
        "futureCheck": Number(this.facility_form.get('furture_check')?.value),
        "interval": Number(this.facility_form.get('interval_to_check')?.value),
        "emailNotification": this.facility_form.get('mail_notification')?.value,
        "userID": 'H317697'
      }
      
      if (this.action_type != 'Update Facility') {
        this.Add_new_facility(body);
      } else if (this.action_type === 'Update Facility') {
        this.update_new_facility(body);
      }
    } else {
      console.log("Form is invalid!");
      this.facility_form.markAllAsTouched();
      this.common_service.displayWarning('Form is not valid.Please fill all required details');
    }
  }

  Is_spinner: boolean = false
  Add_new_facility(body: any) {
    this.api_service.Add_new_facility(body).subscribe({
      next: (res: any) => {
        this.Is_spinner = false;
        this.dialogRef.close();
        this.common_service.displaySuccess('Facility added Successfully.');
      },
      error: (err) => {
        this.Is_spinner = false;
        this.common_service.displayWarning('Failed to add. Please try again');
      }
    });
  }

  update_new_facility(body: any) {
    this.api_service.update_new_facility(body).subscribe({
      next: (res: any) => {
        this.Is_spinner = false;
        this.dialogRef.close();
        this.common_service.displaySuccess('Facility updated Successfully.');
      },
      error: (err) => {
        this.Is_spinner = false;
        this.common_service.displayWarning('Failed to update. Please try again');
      }
    });
  }

}

// Management User List 

@Component({
  selector: 'management_user_list',
  imports: [
    CommonModule
  ],
  template: `
  <div class="container-fluid common_list_modal">
    <div class="row">
      <div class="col-12">
        <!-- <h2>This information must be read before proceeding.</h2> -->

        <form>
        <h3>List of all management users: </h3>
         <table class="table table-bordered" style="box-shadow: none;">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Hal ID.</th>
              <th>User Name</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of formattedUsers;let i = index">
              <td>{{i+1}}</td>
              <td>{{item.userId}}</td>
              <td>{{item.userName}}</td>
            </tr>
          </tbody>
         </table>
         <div *ngIf="formattedUsers.length === 0" class="no-data-message" style="font-size: 1em; font-weight:600;">
                There are currently no management users available.
            </div>
         <div class="btn_div">
          <button class="yesbtn" style="margin: 0 !important;" type="button" (click)="close()">Close</button>
        </div>
        </form>
      </div>
    </div>
  </div>
  `,
  styleUrl: './all-facility-add-update.component.scss'
})

export class management_user_list {
  formattedUsers: any[] = [];
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public management_user_listDialogRef: MatDialogRef<management_user_list>) {
    this.formattedUsers = data.user_list;
    // this.formattedUsers = data.user_list.split(',');
  }

  ngOnInit() {
    // this.formatUserIds();
  }

  // formatUserIds() {
  //   const userNames = ["Sameer", "Sameer", "Sameer", "Sameer"]; // example user names
  //   this.formattedUsers = [];
  //   this.user_list.forEach((userId: any, index: number) => {
  //     this.formattedUsers.push({
  //       userId: userId,
  //       userName: userNames[index] || "Unknown"
  //     });
  //   });

  //   console.log(this.formattedUsers);
  // }

  close() {
    this.management_user_listDialogRef.close()
  }

}


// Delete Facility

@Component({
  selector: 'delete_facility',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule
  ],
  template: `
  <div class="container-fluid delete_modal">
    <div class="row">
      <div class="col-12">
        <h2>Delete Facility Confirmation</h2>

        <form>
        <label>Are you sure you want to delete facility: <strong>{{facility_name}}</strong>? <br> This action cannot be undone.</label>
        <div class="btn_div">
        <button class="yesbtn" (click)="delete_Facility()" *ngIf="!Is_spinner">Yes, Delete</button>
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
  styleUrl: './all-facility-add-update.component.scss'
})

export class delete_facility {

  facility_name = ''
  facilityID = ''
  constructor(public dialogRef: MatDialogRef<delete_facility>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private commonService: CommonServiceService,
    private api_service: AllApiServiceService) {
    this.facility_name = data.facility
    this.facilityID = data.facilityID
  }

  close() {
    this.dialogRef.close()
    this.facility_name = ''
  }

  Is_spinner: boolean = false;
  delete_Facility() {
    if (this.facility_name != '') {
      this.Is_spinner = true
      this.api_service.delete_Facility(this.facilityID).subscribe({
        next: (res) => {
          this.Is_spinner = false
          this.facility_name = ''
          this.close()
          this.commonService.displaySuccess("Facility deleted sucessfully.")
        }, error: (err) => {
          this.Is_spinner = false
          console.log(err.message)
          this.commonService.displayWarning('Failed to delete Facility. Please try again later.')
        }
      })
    }
  }

}

// Calibration Settings

@Component({
  selector: 'calibration_details',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  template: `
  <div class="container-fluid common_dialog">
    <div class="row">
        <div class="col-12">
            <h2>Calibration Settings</h2>

            <form [formGroup]="facility_form">
                <div class="form-group" style="width: max-content;">
                    <div class="form_field">
                        <label for="mail_notification">Email Notifications Enabled:
                            <input [readOnly]="true" type="checkbox" id="mail_notification" class="form-control"
                                formControlName="mail_notification" class="mx-2">
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <div class="form_field" style="flex-direction: row;">
                        <label for="contact" style="width: 40%;">Contact:</label>
                        <input [readOnly]="true" type="text" id="furture_check" class="form-control mx-3"
                            formControlName="contact">
                    </div>

                </div>

                <div class="form-group">
                    <div class="form_field" style="flex-direction: row;">
                        <label for="furture_check" style="width: 40%;">Furture Check (Days):</label>
                        <input [readOnly]="true" type="number" id="furture_check" class="form-control mx-3"
                            formControlName="furture_check">
                    </div>
                </div>

                <div class="form-group">
                    <div class="form_field" style="flex-direction: row;">
                        <label for="interval_to_check" style="width: 40%;">Interval To Check (Days):</label>
                        <input [readOnly]="true" type="number" id="interval_to_check" class="form-control mx-3"
                            formControlName="interval_to_check">
                    </div>
                </div>
                <div class="btn_div">
                    <button (click)="close()" type="reset">Close</button>
                </div>
            </form>
        </div>
    </div>
</div>
  `,
  styleUrl: './all-facility-add-update.component.scss'
})

export class calibration_details {
  facility_form !: FormGroup
  facility_id:any
  constructor(
    private api_service: AllApiServiceService,
    public common_service: CommonServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<calibration_details>,
    public fb: FormBuilder) {
    this.facility_form = this.fb.group({
      contact: [''],
      mail_notification: [false],
      furture_check: [''],
      interval_to_check: [''],
    });

      this.facility_id = data.facility_id
      this.get_Facility_details(this.facility_id)
  }

  facility_details: any
  get_Facility_details(facility_id:any){
     this.api_service.get_Facility_details(facility_id).subscribe({
       next: (res: any) => {
         this.facility_details = res[0]
         this.facility_form.patchValue({
           contact: this.facility_details?.contactName,
           mail_notification: this.facility_details?.emailNotification,
           furture_check: this.facility_details?.futureCheck,
           interval_to_check: this.facility_details?.interval,
         });
       },
      
      error: (err) => {
        console.error('Error fetching tasks:', err);
      }
    });
  }

  close() {
    this.dialogRef.close()
  }

}
