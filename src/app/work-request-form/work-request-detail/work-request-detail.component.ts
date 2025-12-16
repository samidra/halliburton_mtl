import { Component, ElementRef, HostListener, Inject, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { CommonServiceService } from '../../Services/common-service.service';
import { AllApiServiceService } from '../../Services/all-api-service.service';
import { LocalStorageService } from '../../Services/local-storage.service';

@Component({
  selector: 'app-work-request-detail',
  imports: [CommonModule],
  templateUrl: './work-request-detail.component.html',
  styleUrl: './work-request-detail.component.scss'
})

export class WorkRequestDetailComponent {

  constructor(private titleService: Title,
    private route: ActivatedRoute,
    private router: Router,
    private apiservice: AllApiServiceService,
    private local_storage: LocalStorageService,
    private dialog: MatDialog) {
    this.route.paramMap.subscribe((params) => {
      const request_number = params.get('work_request_no')
      this.request_number = request_number
      this.get_request_details()
    })
  }
  request_number: any
  isLoading: boolean = true
  ngOnInit(): void {


    this.titleService.setTitle(`Work Request Detail ${this.request_number} | MTL HALLIBURTON`);
  }

  request_details: any
  task_details: any
  get_request_details() {
    this.apiservice.get_workrequest_details(this.request_number).subscribe((res) => {

      const details = res;
      console.log(res)
      if (Array.isArray(details) && details.length > 0) {
        this.request_details = details[0].workRequestLists[0];
        this.task_details = details[0].taskLists;

      } else {
        this.request_details = null; // or handle the error
      }
      this.isLoading = false
    })
  }

  task_details_by_index: any
  task_index: any
  get_task_details(i: any) {
    this.task_index = i;
    this.task_details_by_index = this.task_details[i];
    const task = this.task_details_by_index;
    const taskRequestNo = task.taskId;
    // sessionStorage.setItem('task_details_by_index', JSON.stringify(task));
    const url = `task-request/detail/${this.request_details?.workId}/${taskRequestNo}`;
    window.open(url, '_blank')
  }

  modify_work_request_details() {
    const dialogRef = this.dialog.open(modify_work_request_details, {
      data: { request_details: this.request_details },
      width: '600px',
      panelClass: 'custom-dialog-container',
      disableClose: true,
    })

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'submitted') {
        this.get_request_details()
        window.scrollTo(0, 0)
        // this.upload_link.push(result);
      }
    })
  }

  modify_details(request_task_action: any) {
    if (request_task_action === 'new') {
      const dialogRef = this.dialog.open(modify_details, {
        data: { work_id: this.request_number, is_new: request_task_action },
        width: '600px',
        panelClass: 'custom-dialog-container',
        disableClose: true,
      })

      dialogRef.afterClosed().subscribe(result => {
        if (result === 'submitted') {
          this.get_request_details()
          window.scrollTo(0, 0)
          this.task_details_by_index = ''
          // this.upload_link.push(result);
        }
      })
    } else {
      const dialogRef = this.dialog.open(modify_details, {
        data: { work_data: this.task_details_by_index },
        width: '600px',
        panelClass: 'custom-dialog-container',
        disableClose: true,
      })

      dialogRef.afterClosed().subscribe(result => {
        if (result === 'submitted') {
          this.task_details_by_index = ''
          this.get_request_details()
          window.scrollTo(0, 0)
          // this.upload_link.push(result);
        }
      })
    }
  }

  submit_approval(item: any) {
    const data = {
      wRnumber: this.request_number,
      taskNumber: item.taskId,
      duration: item.daysRequested,
      location: item.location,
      resource: item.resource,
    };
    this.local_storage.setDataFormCalender(data);
    this.router.navigate([`calendar`, this.request_number, item.taskId]);
  }

}


// Modify Work Request Details

@Component({
  selector: 'modify_work_request_details',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
  <div class="container-fluid common_dialog modify">
    <div class="row">
        <div class="col-12">
            <h2>Modify Request Information</h2>
            <form [formGroup]="modify_form">

                <div class="form-group">
                    <div class="form_field">
                        <label>Work ID:</label>
                        <input type="text" class="form-control" formControlName="work_id" readonly />
                    </div>
                </div>

                <div class="form-group">
                    <div class="form_field">
                        <label for="requestDescription">Description:</label>

                        <input type="text" id="requestDescription" class="form-control"
                            formControlName="requestDescription" placeholder="Description" />
                    </div>
                    <div *ngIf="modify_form.get('requestDescription')?.invalid && modify_form.get('requestDescription')?.touched"
                        class="text-danger error">
                        Description is required.
                    </div>
                </div>

                <!-- <div class="form-group">
                    <div class="form_field">
                        <label for="chargeCode">Charge Code: </label>
                        <span style="color:red;">(**Non editable)</span>
                        <div class="form_field_dropdown" style="width: 100%;">
                            <input id="chargeCode" type="text" class="form-control" placeholder="Search charge code"
                                formControlName="chargeCode" readonly (click)="show('chargeCode')"  #inputField>
                               
                            <ul *ngIf="chargeCodeOptions.length !=0" class="list_drop" #dropdownContainer>
                                <li *ngFor="let option of chargeCodeOptions"
                                    (click)="selectOption('chargeCode',option)">{{option}}</li>
                            </ul>
                        </div>
                    </div>
                    <div *ngIf="modify_form.get('chargeCode')?.invalid && modify_form.get('chargeCode')?.touched"
                        class="text-danger error">
                         <div *ngIf="modify_form.get('chargeCode')?.hasError('required')">
                                Charge Code is required.
                            </div>

                            <div *ngIf="modify_form.get('chargeCode')?.hasError('noMatch')">
                                Please select a valid Charge Code.
                            </div>
                    </div>
                </div> -->

                <div class="form-group">
                    <div class="form_field">
                        <label for="tools">Tools: </label>
                        <div class="form_field_dropdown" style="width: 100%;">
                            <input id="tools" type="text" class="form-control" placeholder="Search tool"
                                formControlName="tools" (click)="show('tools')" #inputField>
                            <ul *ngIf="toolsOptions.length !=0" class="list_drop" #dropdownContainer>
                                <li *ngFor="let option of toolsOptions"
                                (click)="option !== 'No data with this search' ? selectOption('tools',option) : errorMessage('Tool','tools')">
                                    {{option}}</li>
                            </ul>
                        </div>
                    </div>
                    <div *ngIf="modify_form.get('tools')?.invalid && modify_form.get('tools')?.touched"
                        class="text-danger error">
                        <div *ngIf="modify_form.get('tools')?.hasError('required')">
                                Tools is required.
                            </div>

                            <div *ngIf="modify_form.get('tools')?.hasError('noMatch')">
                                Please select a valid Tools.
                            </div>
                    </div>
                </div>

                <div class="form-group">
                    <div class="form_field">
                        <label for="pslCompany">PSL/Company: </label>
                        <div class="form_field_dropdown" style="width: 100%;">
                            <input id="pslCompany" type="text" class="form-control" placeholder="Search PSL/Company"
                                formControlName="pslCompany" (click)="show('pslCompany')" #inputField>
                            <ul *ngIf="pslCompanyOptions.length !=0" class="list_drop" #dropdownContainer>
                                <li *ngFor="let option of pslCompanyOptions"
                                (click)="option !== 'No data with this search' ? selectOption('pslCompany', option) : errorMessage('PSL Company','pslCompany')"
                                >{{option}}</li>
                            </ul>
                        </div>
                    </div>
                    <div *ngIf="modify_form.get('pslCompany')?.invalid && modify_form.get('pslCompany')?.touched"
                        class="text-danger error">
                        <div *ngIf="modify_form.get('pslCompany')?.hasError('required')">
                            PSL/Company is required.
                        </div>

                        <div *ngIf="modify_form.get('pslCompany')?.hasError('noMatch')">
                            Please select a valid PSL/Company.
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <div class="form_field">
                        <label for="group">Group: </label>
                        <div class="form_field_dropdown" style="width: 100%;">
                            <input id="group" type="text" class="form-control" placeholder="Search group"
                                formControlName="group" (click)="show('group')" #inputField>
                            <ul *ngIf="groupOptions.length !=0" class="list_drop" #dropdownContainer>
                                <li *ngFor="let option of groupOptions"
                                (click)="option !== 'No data with this search' ? selectOption('group', option) : errorMessage('Group','group')">
                                    {{option}}</li>
                            </ul>
                        </div>
                    </div>
                    <div *ngIf="modify_form.get('group')?.invalid && modify_form.get('group')?.touched"
                        class="text-danger error">
                        <div *ngIf="modify_form.get('group')?.hasError('required')">
                            Group is required.
                        </div>

                        <div *ngIf="modify_form.get('group')?.hasError('noMatch')">
                            Please select a valid Group.
                        </div>
                    </div>
                </div>

                <div class="btn_div">
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
  styleUrl: './work-request-detail.component.scss'
})

export class modify_work_request_details {

  request_details: any
  chargeCodeOptions: string[] = [];
  toolsOptions: string[] = [];
  pslCompanyOptions: string[] = [];
  groupOptions: string[] = [];
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
      this.chargeCodeOptions = [];
      this.toolsOptions = [];
      this.pslCompanyOptions = [];
      this.groupOptions = [];
    }

  }

  constructor(private fb: FormBuilder,
    private api_service: AllApiServiceService,
    public dialogRef: MatDialogRef<modify_work_request_details>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private common_service: CommonServiceService) {
    this.request_details = data.request_details

    this.get_data_create_request()
  }

  modify_form !: FormGroup;
  resourcesOptions: string[] = [];
  ngOnInit(): void {
    this.modify_form = this.fb.group({
      work_id: ['', Validators.required],
      chargeCode: [''],
      requestDescription: ['', [Validators.required]],
      tools: ['', Validators.required],
      pslCompany: ['', Validators.required],
      group: ['', Validators.required],
    })

    this.form_validator()

  }

  form_validator() {
    const formFields = [
      { field: 'work_id', value: this.request_details.workId },
      { field: 'chargeCode', value: this.request_details.networkNumber },
      { field: 'requestDescription', value: this.request_details.description },
      { field: 'tools', value: this.request_details.toolDescr },
      { field: 'pslCompany', value: this.request_details.psl },
      { field: 'group', value: this.request_details.group },
    ]

    formFields.forEach(field => {
      this.modify_form.get(field.field)?.setValue(field.value);
    });

    // Object.keys(this.modify_form.controls).forEach(controlName => {
    //   const control = this.modify_form.get(controlName);
    //   if (control) {
    //     control.valueChanges.subscribe(() => {
    //       control.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    //     });
    //   }
    // });
  }

  errorMessage(field: any, inputName: any) {
    this.common_service.displayWarning(`Please select valid ${field}`)
    this.modify_form.get(`${inputName}`)?.setValue('')
  }

  allDataRes: any
  location_index: any
  get_data_create_request() {
    this.api_service.get_data_create_request().subscribe((res) => {
      this.allDataRes = res
      this.subscribeToFieldChanges('chargeCode', 'charge_Code')
      this.subscribeToFieldChanges('tools', 'tool')
      this.subscribeToFieldChanges('pslCompany', 'psL_Company')
      this.subscribeToFieldChanges('group', 'group')
    })
  }
  private subscribeToFieldChanges(field: string, dataKey: string): void {
    this.modify_form.get(field)?.valueChanges.subscribe(value => {
      this.filterOptions(field, value, dataKey);
    });
  }

  filterOptions(field: string, value: string, dataKey: string): void {
    const searchTerm = value.trim().toLowerCase();
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
      chargeCode: 'charge_Code',
      tools: 'tool',
      pslCompany: 'psL_Company',
      group: 'group',
    };

    const optionKeys = ['chargeCode', 'tools', 'pslCompany', 'group'];

    optionKeys.forEach((key: any) => {
      const field = `${key}Options` as keyof this
      (this as any)[field] = [];
    });

    const dataKey = value as keyof typeof optionsMap
    if (optionsMap[dataKey]) {
      (this as any)[`${value}Options`] = this.allDataRes[0][optionsMap[dataKey]];
    }

    Object.keys(this.modify_form.controls).forEach(controlName => {
      const control = this.modify_form.get(controlName);
      if (control) {
        control.valueChanges.subscribe(() => {
          control.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        });
      }
    });
  }

  selectOption(field: any, option: string): void {
    const field_name = `${field}Options` as keyof this
    this.modify_form.get(field)?.setValue(option);
    (this as any)[field_name] = [];
  }

  submit_response: any
  Is_spinner: boolean = false
  modify_detail_submit() {
    if (this.modify_form.valid) {
      this.Is_spinner = true
      const body = {
        workId: this.modify_form.get('work_id')?.value,
        // charge_Code: this.modify_form.get('chargeCode')?.value,
        charge_Code: '',
        description: this.modify_form.get('requestDescription')?.value,
        tool: this.modify_form.get('tools')?.value,
        psl: this.modify_form.get('pslCompany')?.value,
        group: this.modify_form.get('group')?.value,
        userID: 'H317697',
      }

      this.api_service.modify_work_request(body).subscribe({

        next: (res) => {
          this.submit_response = res
          if (this.submit_response.status) {
            this.Is_spinner = false
            this.common_service.displaySuccess('Modified Work Request Details Submitted Sucessfully')
            this.dialogRef.close('submitted')
            this.modify_form.reset()
          } else {
            this.common_service.displayWarning('Request fail to modify work request details. Please try again')
            this.Is_spinner = false
          }

        },
        error: (err) => {
          this.Is_spinner = false;
          console.error('API error:', err);
          this.common_service.displayWarning('Request fail to modify work request details. Please try again');
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

}

// Modify Task Details

@Component({
  selector: 'modify_details',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
  <div class="container-fluid common_dialog modify">
    <div class="row">
        <div class="col-12">
            <h2>Create New Task</h2>

            <form [formGroup]="modify_form">

                <div class="form-group">
                    <div class="form_field">
                        <label>Work ID:</label>
                        <input type="text" class="form-control" formControlName="work_id" readonly />
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
                                formControlName="location" (input)="input_location()" (click)="show('location')" #inputField>
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
                            <input id="resources" type="text" class="form-control"
                                placeholder="Search location wise resources" formControlName="resources"
                                (click)="show('resources')" #inputField>
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
                                    <input type="radio" class="mx-1" formControlName="Select_Charge_Code_or_Work_Order"
                                        value="workOrder"> Work Order
                                </label>
                            </div>
                        </div>
                    </div>
                    <div *ngIf="modify_form.get('Select_Charge_Code_or_Work_Order')?.invalid && modify_form.get('Select_Charge_Code_or_Work_Order')?.touched"
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
                                    style="margin-right: 10px;" formControlName="chargeCode"
                                    (click)="show('chargeCode')" #inputField>
                                <ul *ngIf="chargeCodeOptions.length !=0" class="list_drop" #dropdownContainer>
                                    <li *ngFor="let option of chargeCodeOptions"
                                        (click)="option !== 'No data with this search' ? selectOption('chargeCode', option) : errorMessage('Charge Code','chargeCode')">{{option}}</li>
                                </ul>
                            </div>
                        </div>
                        <div class="row">
                            <div class="key-description col-2" *ngFor="let item of chargeCodeList" [title]="item">
                                <i class="bi bi-x-circle-fill" (click)="removechargeCode(item)"></i>
                                {{item.split('-')[0]}}
                            </div>
                        </div>
                    </div>

                <!-- Work Order -->
                <div class="form-group"
                    *ngIf="modify_form.get('Select_Charge_Code_or_Work_Order')?.value === 'workOrder'">
                    <div class="form_field">
                        <label for="workOrder">Work Order:</label>
                        <div class="d-flex">
                          <input type="text" id="workOrder" class="form-control" style="width: 350px !important; margin-right: 10px;"
                            formControlName="workOrder" placeholder="Write your Work Order" />
                        <button type="button" class="button" (click)="add_workOrder('workOrder')">Add More</button>
                        </div>
                    </div>

                    <div class="row">
                        <div class="key-description col-2" *ngFor="let item of workOrderList">
                            <i class="bi bi-x-circle-fill" (click)="removeworkOrder(item)"></i>
                            {{item}}
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
                            formControlName="lithium_batteries_description"
                            placeholder="Write description for Lithium Battery" />
                    </div>
                    <div *ngIf="modify_form.get('lithium_batteries_description')?.invalid && modify_form.get('lithium_batteries_description')?.touched"
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

                        <input type="text" id="Radiation_description" class="form-control"
                            formControlName="Radiation_description" placeholder="Write description for Radiation" />
                    </div>
                    <div *ngIf="modify_form.get('Radiation_description')?.invalid && modify_form.get('Radiation_description')?.touched"
                        class="text-danger error">
                        Radiation Description is required.
                    </div>
                </div>
                
                <div class="btn_div" *ngIf="this.is_new === 'new'">
                    <button class="yesbtn" type="button" *ngIf="!spinner.draft" (click)="submitRequest('Draft')">Save as
                        Draft</button>
                    <button class="yesbtn" type="button" *ngIf="!spinner.submit" (click)="submitRequest('Submit')">Submit</button>

                    <!-- Shared spinner (optional: can differentiate if you want separate spinners) -->
                    <button class="yesbtn" *ngIf="spinner.submit || spinner.draft">
                        <div class="spinner"></div>
                    </button>
                    <button (click)="close()" type="button">Cancel</button>
                </div>
            </form>


        </div>
    </div>
</div>
  `,
  styleUrl: './work-request-detail.component.scss'
})

export class modify_details {

  task_data: any
  is_new: any
  locationOptions: string[] = [];
  resourcesOptions: string[] = [];
  chargeCodeOptions: string[] = [];
  workOrderList: any = []
  chargeCodeList: any = []
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
    private api_service: AllApiServiceService,
    public dialogRef: MatDialogRef<modify_details>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private common_service: CommonServiceService) {
    this.is_new = data.is_new
    if (this.is_new != 'new') {
      this.task_data = data.work_data
    } else {
      this.task_data = data.work_id
    }
    this.get_data_create_request()
  }

  modify_form !: FormGroup;
  ngOnInit(): void {
    this.modify_form = this.fb.group({
      Select_Charge_Code_or_Work_Order: ['', Validators.required],
      work_id: ['', Validators.required],
      description: ['', [Validators.required]],
      location: ['', Validators.required],
      resources: [{ value: '', disabled: true }, Validators.required],
      chargeCode: [''],
      workOrder: [''],
      duration: ['', Validators.required],
      lithium_batteries: ['', Validators.required],
      Radiation: ['', Validators.required]
    })
    this.form_validator()

  }

  form_validator() {
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

    this.modify_form.get('location')?.valueChanges.subscribe(value => {
      this.handleLocationChange(value);
    });

    const formFields = [
      { field: 'work_id', value: this.task_data },
    ]

    formFields.forEach(field => {
      this.modify_form.get(field.field)?.setValue(field.value);
    });

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
      console.log(res)
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
        (this as any)[`${value}Options`] = this.allDataRes[0][optionsMap[dataKey]][this.location_index]?.res;
      }
    }

    Object.keys(this.modify_form.controls).forEach(controlName => {
      const control = this.modify_form.get(controlName);
      if (control) {
        control.valueChanges.subscribe(() => {
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
    const searchTerm = value.trim().toLowerCase();
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

  removechargeCode(item: any) {
    const index = this.chargeCodeList.indexOf(item);
    if (index !== -1) {
      this.chargeCodeList.splice(index, 1);
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

  submit_res: any;
  spinner: { submit: boolean; draft: boolean } = { submit: false, draft: false };
  submitRequest(actionType: 'Submit' | 'Draft') {
    if (actionType === 'Submit' && !this.modify_form.valid) {
      this.modify_form.markAllAsTouched();
      this.common_service.displayWarning('Please fill all details');
      return;
    }

    const requestDescriptionControl = this.modify_form.get('description');
    const locationControl = this.modify_form.get('location');
    const isrequestDescriptionValid = requestDescriptionControl?.valid;
    const islocationValid = locationControl?.valid;
    if (actionType === 'Draft' && (!isrequestDescriptionValid && !islocationValid)) {

      requestDescriptionControl?.markAsTouched();
      locationControl?.markAsTouched();
      this.common_service.displayWarning('Please add Location & Request Description to save as draft');
      return;
    }

    if (this.modify_form.get('duration')?.value === 0) {
      this.common_service.displayWarning('Duration must be greater than 0.');
      return;
    }

    if (actionType === 'Submit' && this.modify_form.valid) {
      const selectedType = this.modify_form.get('Select_Charge_Code_or_Work_Order')?.value;
      if (selectedType === 'chargeCode' && this.chargeCodeList.length === 0) {
        this.common_service.displayWarning('At least one Charge Code is required.');
        return;
      }
      if (selectedType !== 'chargeCode' && this.workOrderList.length === 0) {
        this.common_service.displayWarning('At least one Work Order is required.');
        return;
      }
    }

    // start spinner
    this.spinner[actionType.toLowerCase() as 'submit' | 'draft'] = true;

    const body = {
      workId: this.modify_form.get('work_id')?.value,
      description: this.modify_form.get('description')?.value,
      location: this.modify_form.get('location')?.value,
      resource: this.modify_form.get('resources')?.value,
      charge_Code: '',
      charge_Codes: this.modify_form.get('Select_Charge_Code_or_Work_Order')?.value === 'chargeCode' ? this.chargeCodeList : [],
      work_Orders: this.modify_form.get('Select_Charge_Code_or_Work_Order')?.value != 'chargeCode' ? this.workOrderList : [],
      duration: Number(this.modify_form.get('duration')?.value),
      actionType: actionType === 'Submit' ? 'Submit' : 'Draft',
      lithiumBattery: this.modify_form.get('lithium_batteries')?.value === true ? true : false,
      lithiumBatteryDescription: this.modify_form.get('lithium_batteries_description')?.value,
      radiation: this.modify_form.get('Radiation')?.value === true ? true : false,
      radiationDescription: this.modify_form.get('Radiation_description')?.value,
      Reason: '',
      userID: 'H317697',
    }



    this.api_service.add_new_task_request(body).subscribe({
      next: (res) => {
        this.submit_res = res;

        if (this.submit_res.status) {
          this.resourcesOptions = [];

          const url = `task-request/detail/${this.modify_form.get('work_id')?.value}/${this.submit_res.taskNumber}`;
          this.common_service.displaySuccess(
            actionType === 'Submit'
              ? "New Task request submitted successfully."
              : "New Task request saved as draft successfully."
          );

          window.open(url, '_blank')
          this.dialogRef.close('submitted')
          this.modify_form.reset();
        } else {
          this.common_service.displayWarning("Some error occurred. Please try again.");
        }
        this.spinner[actionType.toLowerCase() as 'submit' | 'draft'] = false;
      },
      error: (err) => {

        this.common_service.displayWarning(err.message);
        this.common_service.displayWarning('Failed to submit new Task request. Please try again later.');
        this.spinner[actionType.toLowerCase() as 'submit' | 'draft'] = false;
      }
    });
  }

  close() {
    this.dialogRef.close()
    this.modify_form.reset()
  }

  input_location() {
    this.modify_form.get('location')?.value.length === 0 ? this.resourcesOptions = [] : ''
  }

}

