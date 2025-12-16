import { Component, ElementRef, HostListener, Inject, NgZone, ViewChild } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { NgxPaginationModule } from 'ngx-pagination';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog"
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AllApiServiceService } from '../Services/all-api-service.service';
import { CommonServiceService } from '../Services/common-service.service';

@Component({
  selector: 'app-all-request-add-update',
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './all-request-add-update.component.html',
  styleUrl: './all-request-add-update.component.scss'
})

export class AllRequestAddUpdateComponent {
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  page = 1;
  itemsPerPage: number = 25;
  searchText: any;
  constructor(private titleService: Title,
    private ngZone: NgZone,
    private api_service: AllApiServiceService,
    public dialog: MatDialog) {
    this.titleService.setTitle('Add/Update All Resources | MTL HALLIBURTON');
  }

  ngOnInit(): void {
    this.startPolling();
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Component destroyed. Polling stopped.');
    }
  }

  startPolling() {
    this.Get_all_resource();
    this.ngZone.runOutsideAngular(() => {
      this.pollingInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.Get_all_resource();
        });
      }, 5000);
    });
  }

  isLoading: boolean = true;
  all_resources: any = []
  Get_all_resource() {
    this.api_service.Get_all_resource().subscribe({
      next: (res: any) => {
        this.all_resources = res;
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
      return this.all_resources;
    }

    const search = this.searchText.toLowerCase();
     return this.all_resources.filter((item: any) => 
       Object.values(item).some((value:any)=>{
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(search);
      })
    );
    
    // return this.all_resources.filter((item: any) => {
    //   const resource = item?.resource;
    //   if (!resource) return false;
    //   return resource.toString().toLowerCase().includes(search);
    // });
  }

  formatDaysRunning(days: string | null | undefined): string {
    return days ? days.replace(/,/g, ', ') : '';
  }

  Is_spinner: boolean = false
  add_update_resource(action_type: any,resource_id:any) {
    if(action_type === 'Add resource'){
       this.Is_spinner = true
    }else{
      this.isLoading = true
    }  
    this.api_service.Get_all_resource_dropdown().subscribe({
      next: (res: any) => {
        this.Is_spinner = false
        this.isLoading = false
        const dialogRef = this.dialog.open(resource, {
          data: { action_type: action_type, data: res, resource_id: action_type != 'Add resource' ? resource_id : ''},
          width: '590px',
          panelClass: 'custom-dialog-container'
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
    });
  }

    view_all_UserList(title:any,list: any) {
    this.isLoading = false;
    const scheduleDialogRef = this.dialog.open(user_list, {
      data: {
        title:title,
        list: list
      },
      width: '400px',
      panelClass: 'custom-dialog-container'
    });
  }

  delete_resource(resource: any, id: any) {
    const dialogRef = this.dialog.open(delete_resource, {
      data: {
        resource: resource,
        resourceID: id
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

// Resource 

@Component({
  selector: 'resource',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  template: `
  <div class="container-fluid common_dialog">
    <div class="row">
        <div class="col-12">
            <h2>{{this.action_type === 'Update resource' ? 'Update Resource' : 'Add New Resource'}}</h2>

            <form class="p-2 pb-0" [formGroup]="resource_form" (ngSubmit)="onSubmit()">

                <div class="form-group border p-1 pt-0" *ngIf="this.action_type === 'Update resource'">
                    <div class="form_field">
                        <label for="resource">Resource: </label>
                        <input  type="text" id="resource"
                            class="form-control" placeholder="Resource Name" formControlName="resource">
                    </div>
                    <div *ngIf="resource_form.get('resource')?.invalid && resource_form.get('resource')?.touched"
                        class="text-danger error">
                        Resource are required.
                    </div>
                </div>
                <h5 *ngIf="this.action_type === 'Update resource'">Resource Setting</h5>

                <div class="form-group border p-1 pt-0" *ngIf="this.action_type != 'Update resource'">
                    <div class="form_field">
                        <label for="resource">Resource: </label>
                        <input type="text" id="resource" class="form-control" placeholder="Resource Name"
                            formControlName="resource">
                    </div>
                    <div *ngIf="resource_form.get('resource')?.invalid && resource_form.get('resource')?.touched"
                        class="text-danger error">
                        Resource are required.
                    </div>
                </div>

                <div class="form-group ">
                    <div class="form_field">
                        <div class="d-flex">
                            <label for="resource_location">Resource Location:</label>
                            <div class="mx-2 d-flex">
                                <label for="resource_available">Resource available to schedule</label>
                                <input type="checkbox" id="resource_available"
                                    formControlName="resource_available_to_schedule" class="mx-3">
                            </div>
                        </div>

                        <div class="form_field_dropdown">
                            <input id="location" type="text" class="form-control" placeholder="Search location"
                                formControlName="resource_location" required (click)="show('location')"
                                (input)="filteredAutocomplete('location',$event)" #inputField>
                            <ul *ngIf="filteredLocations.length !== 0" class="list_drop" #dropdownContainer>
                                <li *ngFor="let option of filteredLocations" (click)="selectOption('location',option)">
                                    {{ option }}
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div *ngIf="resource_form.get('resource_location')?.invalid && resource_form.get('resource_location')?.touched"
                        class="text-danger error">
                        <div *ngIf="resource_form.get('resource_location')?.hasError('required')">
                            Resource Location is required.
                        </div>

                        <div *ngIf="resource_form.get('resource_location')?.hasError('noMatch')">
                            Please select a valid location.
                        </div>
                    </div>

                </div>

                <div class="form-group">
                    <label>Running Days:</label>
                    <div class="d-flex flex-wrap">
                        <div class="form-check" *ngFor="let day of daysOfWeek">
                            <input type="checkbox" class="form-check-input" [id]="day" [formControlName]="day" />
                            <label class="form-check-label" [attr.for]="day">{{ day }}</label>
                        </div>
                    </div>

                    <div *ngIf="!atLeastOneDaySelected() && resource_form.touched" class="text-danger error">
                        Please select at least one running day.
                    </div>
                </div>

                <!-- <div class="form-group">
                    <div class="form_field">
                        <label for="discription">Short Discription (Title):(Format: resource location - equipment title)
                        </label>
                        <input type="text" placeholder="Format: resource location - equipment title" id="discription"
                            class="form-control" formControlName="discription" />
                    </div>
                    <div *ngIf="resource_form.get('discription')?.invalid && resource_form.get('discription')?.touched"
                        class="text-danger error">
                        Discription is required.
                    </div>
                </div> -->

                <div class="form-group">
                    <div class="form_field">
                        <label for="long_discription">Long Discription:</label>
                        <input type="text" placeholder="Write Long Discription" id="long_discription"
                            class="form-control" formControlName="long_discription" />
                    </div>
                    <div *ngIf="resource_form.get('long_discription')?.invalid && resource_form.get('long_discription')?.touched"
                        class="text-danger error">
                        Long Discription is required.
                    </div>
                </div>

                <div class="form-group">
                    <div class="form_field">
                        <div class="d-flex">
                            <label for="approvers">Approvers:</label>
                            <div class="mx-2 d-flex">
                                <label for="auto">Auto-Approve</label>
                                <input type="checkbox" id="auto" class="mx-3" formControlName="auto_approve">
                            </div>
                        </div>

                        <div class="form_field_dropdown">
                            <input id="approvers" type="text" class="form-control" placeholder="Search approvers"
                                formControlName="approvers" (click)="show('approvers')"
                                (input)="filteredAutocomplete('approvers',$event)" #inputField>
                            <ul *ngIf="filteredapprovers?.length !== 0" class="list_drop" #dropdownContainer>
                                <li *ngFor="let option of filteredapprovers" (click)="selectOption('approvers',option)">
                                    {{ option }}
                                </li>
                            </ul>
                        </div>

                        <div class="row">
                            <div class="key-description col-2" *ngFor="let item of approvers_list">
                                <i class="bi bi-x-circle-fill" (click)="removeapprover(item)"></i>
                                {{item}}
                            </div>
                        </div>

                    </div>
                    <div *ngIf="approvers_list?.length === 0" class="text-danger error">
                        Atleast one approvers is required.
                    </div>
                </div>

                <div class="form-group">
                    <div class="form_field">
                        <label for="technician">Technician:</label>
                        <div class="form_field_dropdown">
                            <input id="technician" type="text" class="form-control" placeholder="Search technician"
                                formControlName="technician" (click)="show('technician')"
                                (input)="filteredAutocomplete('technician',$event)" #inputField>
                            <ul *ngIf="filteredtechnicians?.length !== 0" class="list_drop" #dropdownContainer>
                                <li *ngFor="let option of filteredtechnicians;"
                                    (click)="selectOption('technician',option)">
                                    {{ option }}
                                </li>
                            </ul>

                        </div>
                    </div>
                    <div class="row">
                        <div class="key-description col-2" *ngFor="let item of technician_list">
                            <i class="bi bi-x-circle-fill" (click)="removetechnician(item)"></i>
                            {{item}}
                        </div>
                    </div>
                    <div *ngIf="technician_list?.length === 0" class="text-danger error">
                        Atleast one technician is required.
                    </div>
                </div>

                <div class="btn_div">
                    <button type="submit" *ngIf="!Is_spinner" class="yesbtn">
                        {{this.action_type === 'Update resource' ? 'Update Resource' : 'Add Resource'}}
                    </button>
                    <button type="button" class="yesbtn" *ngIf="Is_spinner">
                        <div class="spinner"></div>
                    </button>
                    <button type="reset" (click)="close()">Close</button>
                </div>
            </form>
        </div>
    </div>
  </div>
  `,
  styleUrl: './all-request-add-update.component.scss'
})

export class resource {
  resource_form !: FormGroup;
  action_type: any
  dropdownData: any
  locationOptions: string[] = [];
  userlistOptions: string[] = [];

  daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
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
      // this.locationOptions = [];
      this.filteredLocations = [];
      this.filteredapprovers = [];
      this.filteredtechnicians = [];
    }
  }

  resource_id:any 
  constructor(private fb: FormBuilder,
    private api_service: AllApiServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public common_service: CommonServiceService,
    public dialogRef: MatDialogRef<resource>) {
    this.action_type = data.action_type
    this.dropdownData = data?.data
    this.locationOptions = this.dropdownData?.locations
    this.userlistOptions = this.dropdownData?.users
    if(this.action_type != 'Add resource'){
      this.resource_id = data?.resource_id
      this.get_resource_details(this.resource_id)
    }
  }

  approvers_list: any = []
  technician_list: any = []
  ngOnInit(): void {

    this.resource_form = this.fb.group({
      resource: ['', Validators.required],
      resource_available_to_schedule: [false],
      resource_location: ['', Validators.required],
      // discription: ['', Validators.required],
      long_discription: ['', Validators.required],
      approvers: [''],
      auto_approve: [false],
      technician: [''],
      Monday: [false],
      Tuesday: [false],
      Wednesday: [false],
      Thursday: [false],
      Friday: [false],
      Saturday: [false],
      Sunday: [false],
      runningDays: [[]]
    });

    this.daysOfWeek.forEach(key => {
      this.resource_form.get(key)?.valueChanges.subscribe(() => {
        const selected = this.daysOfWeek.filter(key => this.resource_form.get(key)?.value === true)
        this.resource_form.get('runningDays')?.setValue(selected, { emitEvent: false });
      })
    })

    this.resource_form.get('resource_location')?.valueChanges.subscribe(() => {
      this.locationValidator();
    })
  }

  resource_details: any
  get_resource_details(resource_id:any){
     this.api_service.get_resource_details(resource_id).subscribe({
       next: (res: any) => {
         this.resource_details = res[0]
         
         this.approvers_list = this.resource_details.approvers != null ? this.resource_details.approvers?.split(',') : [];
         this.technician_list = this.resource_details.technician != null ? this.resource_details.technician?.split(',') : [];

         this.resource_form.patchValue({
           resource: this.resource_details.resource,
           resource_available_to_schedule: this.resource_details.availableToSchedule,
           resource_location: this.resource_details.resourceLocation,
           long_discription: this.resource_details.longDescription,
           auto_approve: this.resource_details.autoApprove,
         });

         this.locationValidator()
         
         this.daysOfWeek.forEach(day => {
           this.resource_form.get(day)?.setValue(
              this.resource_details.daysRunning?.includes(day) || false,
            { emitEvent: false }
           );
         });
       },
      error: (err) => {
        console.error('Error fetching tasks:', err);
      }
    });
  }

  locationValidator() {
    const formControl = this.resource_form.get('resource_location');
    const location = formControl?.value;
    const isValidOption = this.locationOptions.includes(location);
    if (!isValidOption && location) {
      formControl?.setErrors({ noMatch: true });
    }
  }

  atLeastOneDaySelected(): boolean {
    return this.daysOfWeek.some(day => this.resource_form.get(day)?.value);
  }

  filteredLocations: string[] = [];
  filteredapprovers: string[] = [];
  filteredtechnicians: string[] = [];
  show(searchIfield: any): void {
    if (searchIfield === 'location') {
      this.filteredLocations = [...this.locationOptions];
      this.filteredapprovers = [];
      this.filteredtechnicians = [];
    } else if (searchIfield === 'approvers') {
      this.filteredapprovers = [...this.userlistOptions];
      this.filteredLocations = [];
      this.filteredtechnicians = [];
    } else if (searchIfield === 'technician') {
      this.filteredtechnicians = [...this.userlistOptions];
      this.filteredLocations = [];
      this.filteredapprovers = [];
    }
  }

  filteredAutocomplete(searchIfield: any, event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    if (searchIfield === 'location') {
      if (input) {
        this.filteredLocations = this.locationOptions.filter((item: string) =>
          item.toLowerCase().includes(input.toLowerCase())
        );
      } else {
        this.filteredLocations = [...this.locationOptions];
      }
    } else if (searchIfield === 'approvers') {
      if (input) {
        this.filteredapprovers = this.userlistOptions.filter((item: string) =>
          item.toLowerCase().includes(input.toLowerCase())
        );
        this.filteredapprovers = this.filteredapprovers.length > 0 ? this.filteredapprovers : ['No data with this search'];
      } else {
        this.filteredapprovers = [...this.userlistOptions];
      }
    } else if (searchIfield === 'technician') {
      if (input) {
        this.filteredtechnicians = this.userlistOptions.filter((item: string) =>
          item.toLowerCase().includes(input.toLowerCase())
        );
        this.filteredtechnicians = this.filteredtechnicians.length > 0 ? this.filteredtechnicians : ['No data with this search'];
      } else {
        this.filteredtechnicians = [...this.userlistOptions];
      }
    }

  }

  removeapprover(item: any) {
    const index = this.approvers_list.indexOf(item);
    if (index !== -1) {
      this.approvers_list.splice(index, 1);
    }
  }

  removetechnician(item: any) {
    const index = this.technician_list.indexOf(item);
    if (index !== -1) {
      this.technician_list.splice(index, 1);
    }
  }

  selectOption(searchIfield: any, option: string): void {
    if (searchIfield === 'location') {
      this.resource_form.get('resource_location')?.setValue(option);
      this.filteredLocations = [];

    } else if (searchIfield === 'approvers') {
      this.resource_form.get('approvers')?.setValue(option);
      const selected = this.resource_form.get('approvers')?.value;

      if (!this.approvers_list.includes(selected)) {
        this.approvers_list.push(selected);
      } else {
        this.common_service.displayWarning('Approver already exists');
      }

      this.resource_form.get('approvers')?.setValue('');
      this.filteredapprovers = [];

    } else if (searchIfield === 'technician') {
      this.resource_form.get('technician')?.setValue(option);
      const selected = this.resource_form.get('technician')?.value;

      if (!this.technician_list.includes(selected)) {
        this.technician_list.push(selected);
      } else {
        this.common_service.displayWarning('Technician already exists');
      }

      this.resource_form.get('technician')?.setValue('');
      this.filteredtechnicians = [];
    }
  }

  Is_spinner: boolean = false
  onSubmit() {

    if (this.resource_form.valid) {
      if (this.approvers_list.length === 0) {
        this.common_service.displayWarning('Atleast one approvers is required.')
        return
      }
      if (this.technician_list.length === 0) {
        this.common_service.displayWarning('Atleast one technician is required.')
        return
      }
      this.Is_spinner = true
      const approvers = this.approvers_list.join(', ')
      const technician = this.technician_list.join(', ')
      this.daysOfWeek.forEach(key => {
        const selected = this.daysOfWeek.filter(key => this.resource_form.get(key)?.value === true)
        this.resource_form.get('runningDays')?.setValue(selected, { emitEvent: false });
      })
      const daysRunning = this.resource_form.get('runningDays')?.value.join(', ')
      const body = {
        "resourceID": this.action_type === 'Update resource' ? Number(this.resource_id) : 0 ,
        "resource": this.resource_form.get('resource')?.value,
        "resourceLocation": this.resource_form.get('resource_location')?.value,
        "shortDescription": this.resource_form.get('resource')?.value,
        "longDescription": this.resource_form.get('long_discription')?.value,
        "approvers": approvers,
        "technician": technician,
        "daysRunning": daysRunning,
        "autoApprove": this.resource_form.get('auto_approve')?.value,
        "availableToSchedule": this.resource_form.get('resource_available_to_schedule')?.value,
        "userNames": '',
        "userID": 'H317697'
      }
      console.log(body) 
      if (this.action_type != 'Update resource') {
        this.Add_new_resource(body);  
      } else if (this.action_type === 'Update resource') {
        this.update_new_resource(body);  
      }
     
    } else {
      this.resource_form.markAllAsTouched();
      this.common_service.displayWarning('Form is not valid.Please fill all required details');
    }
  }

  Add_new_resource(body: any) {
  this.api_service.Add_new_resource(body).subscribe({
    next: (res: any) => {
      this.Is_spinner = false;
      this.dialogRef.close();
      this.common_service.displaySuccess('Resource added Successfully.');
    },
    error: (err) => {
      this.Is_spinner = false;
      this.common_service.displayWarning('Failed to add. Please try again');
    }
  });
}

  update_new_resource(body: any) {
  this.api_service.update_new_resource(body).subscribe({
    next: (res: any) => {
      this.Is_spinner = false;
      this.dialogRef.close();
      this.common_service.displaySuccess('Resource updated Successfully.');
    },
    error: (err) => {
      this.Is_spinner = false;
      this.common_service.displayWarning('Failed to update. Please try again');
    }
  });
}

  close() {
    this.dialogRef.close()
  }
}

// Delete Resource

@Component({
  selector: 'delete_resource',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule
  ],
  template: `
  <div class="container-fluid common_list_modal">
    <div class="row">
      <div class="col-12">
        <h2>Delete Resource Confirmation</h2>

        <form>
        <label>Are you sure you want to delete resource: <strong>{{resource_name}}</strong>? <br> This action cannot be undone.</label>
        <div class="btn_div">
        <button class="yesbtn" (click)="delete_resource()" *ngIf="!Is_spinner">Yes, Delete</button>
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
  styleUrl: './all-request-add-update.component.scss'
})

export class delete_resource {

  resource_name = ''
  resourceID = ''
  constructor(public dialogRef: MatDialogRef<delete_resource>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private commonService: CommonServiceService,
    private api_service: AllApiServiceService) {
    this.resource_name = data.resource
    this.resourceID = data.resourceID
  }

  close() {
    this.dialogRef.close()
    this.resource_name = ''
  }

  Is_spinner: boolean = false;
  delete_resource() {
    if (this.resource_name != '') {
      this.Is_spinner = true
      this.api_service.delete_resource(this.resourceID).subscribe({
        next: (res) => {
          this.Is_spinner = false
          this.resource_name = ''
          this.close()
          this.commonService.displaySuccess("Resource deleted sucessfully.")
        }, error: (err) => {
          this.Is_spinner = false
          console.log(err.message)
          this.commonService.displayWarning('Failed to delete resource. Please try again later.')
        }
      })
    }
  }

}

// User List 

@Component({
  selector: 'user_list',
  imports: [
    CommonModule
  ],
  template: `
  <div class="container-fluid common_list_modal">
    <div class="row">
      <div class="col-12">
        <!-- <h2>This information must be read before proceeding.</h2> -->

        <form>
        <h3>List of all {{heading_title}}: </h3>
         <table class="table table-bordered" style="box-shadow: none;">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Hal ID.</th>
              <th>Name</th>
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
                There are currently no {{heading_title}} available.
            </div>
         <div class="btn_div">
          <button class="yesbtn" style="margin: 0 !important;" type="button" (click)="close()">Close</button>
        </div>
        </form>
      </div>
    </div>
  </div>
  `,
  styleUrl: './all-request-add-update.component.scss'
})

export class user_list {
  formattedUsers: any[] = [];
  heading_title = ''
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public user_listDialogRef: MatDialogRef<user_list>) {
      this.formattedUsers = data.list;
      this.heading_title = data.title;
  }

  ngOnInit() { } 

  close() {
    this.user_listDialogRef.close()
  }

}