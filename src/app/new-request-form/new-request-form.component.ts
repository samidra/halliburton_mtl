import { Component, ElementRef, HostListener, Inject, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog"
import { Title } from '@angular/platform-browser';
import { AllApiServiceService } from '../Services/all-api-service.service';
import { CommonServiceService } from '../Services/common-service.service';
import { Router } from '@angular/router';
import { LocalStorageService } from '../Services/local-storage.service';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../Services/auth/auth.service';
@Component({
  selector: 'app-new-request-form',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule
  ],
  templateUrl: './new-request-form.component.html',
  styleUrl: './new-request-form.component.scss',
  standalone: true,
})
export class NewRequestFormComponent {
  new_work_request !: FormGroup;
  chargeCodeOptions: string[] = [];
  toolsOptions: string[] = [];
  locationOptions: string[] = [];
  resourcesOptions: string[] = [];
  pslCompanyOptions: string[] = [];
  groupOptions: string[] = [];
  workOrderList: any = []
  chargeCodeList: any = []
  activityCodeShow: boolean = false;
  isLoading: boolean = true;
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
      this.locationOptions = [];
      this.pslCompanyOptions = [];
      this.groupOptions = [];
      this.resourcesOptions = [];
    }

  }

  User: User | null | undefined | any;
  private userSubscription !: Subscription;
  user_id: any;
  constructor(private fb: FormBuilder,
    private authService: AuthService,
    public dialog: MatDialog,
    public router: Router,
    private titleService: Title,
    private local_storage: LocalStorageService,
    private commonService: CommonServiceService,
    private api_service: AllApiServiceService) {

    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.User = user;
      const input = this.User?.userName;
      let parts: any = input?.split('\\');
      if (parts && parts.length > 1) {
        this.user_id = parts[1];
      }
    })

    this.new_work_request = this.fb.group({
      Select_Charge_Code_or_Work_Order: ['', Validators.required],
      chargeCode: [''],
      workOrder: ['', [Validators.pattern('^[0-9]+$')]],
      activityCode: ['',],
      requestDescription: ['', [Validators.required]],
      tools: ['', Validators.required],
      location: ['', Validators.required],
      resources: [{ value: '', disabled: true }, Validators.required],
      duration: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      pslCompany: ['', Validators.required],
      group: ['', Validators.required],
      lithium_batteries: ['', Validators.required],
      Radiation: ['', Validators.required],
      fileAttachment: [null]
    });

    this.form_validator()
  }

  ngOnInit(): void {
    const title = "New Work Request | TestTrack HALLIBURTON";
    this.titleService.setTitle(title);
  }

  ngOnDestroy() {
    this.userSubscription?.unsubscribe();
  }

  input_location() {
    this.new_work_request.get('location')?.value.length === 0 ? this.resourcesOptions = [] : ''
  }

  form_validator() {
    this.new_work_request.get('location')?.valueChanges.subscribe(value => {
      this.handleLocationChange(value);
    });

    this.new_work_request.get('lithium_batteries')?.valueChanges.subscribe(value => {
      if (value != true) {
        this.new_work_request.removeControl('lithium_batteries_description');
        return
      }
      this.new_work_request.addControl('lithium_batteries_description', new FormControl('', [Validators.required]));
      if (value === true) { this.new_work_request.get('lithium_batteries_description')?.setValue('') }
    })

    this.new_work_request.get('Radiation')?.valueChanges.subscribe(value => {
      if (value != true) {
        this.new_work_request.removeControl('Radiation_description');
        return
      }
      this.new_work_request.addControl('Radiation_description', new FormControl('', [Validators.required]));
      if (value === true) { this.new_work_request.get('Radiation_description')?.setValue('') }
    })

    this.get_data_create_request()

    Object.keys(this.new_work_request.controls).forEach(controlName => {
      const control = this.new_work_request.get(controlName);
      if (control) {
        control.valueChanges.subscribe(() => {

          control.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        });
      }
    });

    this.new_work_request.get('Select_Charge_Code_or_Work_Order')?.valueChanges.subscribe((value) => {
      if (value === 'workOrder') {
        this.chargeCodeList = []
        this.activityCodeShow = false
        this.new_work_request.get('activityCode')?.setValue('')
        this.new_work_request.get('activityCode')?.clearValidators()
        this.new_work_request.get('activityCode')?.markAsUntouched()
        this.new_work_request.get('activityCode')?.updateValueAndValidity()
      } else {
        this.workOrderList = []
      }
    })

  }

  handleLocationChange(value: string): void {
    const locationControl = this.new_work_request.get('location');
    const resourcesControl = this.new_work_request.get('resources');

    const isLocationInvalid = !value || locationControl?.invalid;

    if (isLocationInvalid) {
      resourcesControl?.disable();
      resourcesControl?.setValue('');
    } else {
      resourcesControl?.enable();
    }
  }

  private subscribeToFieldChanges(field: string, dataKey: string): void {
    this.new_work_request.get(field)?.valueChanges.subscribe(value => {
      this.filterOptions(field, value, dataKey);
    });
  }

  add_workOrder(field: any) {
    if (field === 'workOrder') {

      const rawValue = this.new_work_request.get('workOrder')?.value;
      const value = rawValue != null ? String(rawValue).trim() : '';

      if (!value) {
        this.commonService.displayWarning('Work order cannot be empty.');
        return;
      }

      if (value.length !== 9 || !/^\d{9}$/.test(value)) {
        this.commonService.displayWarning('Work order must be exactly 9 digits.');
        return;
      }

      if (this.workOrderList.includes(value)) {
        this.commonService.displayWarning('This work order is already added.');
        return;
      }

      this.workOrderList.push(value);
      this.new_work_request.get('workOrder')?.setValue('');
    }

  }

  removechargeCode(item: any) {
    const index = this.chargeCodeList.indexOf(item);
    if (index !== -1) {
      this.chargeCodeList.splice(index, 1);
      if (this.chargeCodeList.some((item: string) => item.startsWith('HT'))) {
        this.activityCodeShow = true;
      } else {
        this.activityCodeShow = false
        this.new_work_request.get('activityCode')?.setValue('')
        this.new_work_request.get('activityCode')?.clearValidators()
        this.new_work_request.get('activityCode')?.markAsUntouched()
        this.new_work_request.get('activityCode')?.updateValueAndValidity()
      }
    }
  }

  errorMessage(field: any, inputName: any) {
    this.commonService.displayWarning(`Please select valid ${field}`)
    this.new_work_request.get(`${inputName}`)?.setValue('')
  }

  removeworkOrder(item: any) {
    const index = this.workOrderList.indexOf(item);
    if (index !== -1) {
      this.workOrderList.splice(index, 1);
    }
  }

  allDataRes: any
  work_request_id: any
  task_id_required: any
  get_data_create_request() {
    this.api_service.get_data_create_request().subscribe((res) => {
      this.allDataRes = res
      this.isLoading = false;
      this.subscribeToFieldChanges('chargeCode', 'charge_Code')
      this.subscribeToFieldChanges('tools', 'tool')
      this.subscribeToFieldChanges('location', 'test_Location')
      this.subscribeToFieldChanges('pslCompany', 'psL_Company')
      this.subscribeToFieldChanges('group', 'group')
    })
  }

  fileBase64: string = '';
  fileName: any = '';
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      // this.new_work_request.patchValue({
      //   fileAttachment: file
      // });
      this.fileName = file.name
      this.convertToBase64(file);
    }
  }

  convertToBase64(file: File) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.fileBase64 = reader.result as string;
      console.log('File converted:', this.fileBase64);
    };
    reader.onerror = (error) => {
      console.error('File read error:', error);
      this.commonService.displayWarning('Failed to read file.');
      this.fileBase64 = '';
    };
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
    const formControl = this.new_work_request.get(field);
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
      this.new_work_request.get('resources')?.setValue('');
    }
  }

  show(value: string): void {
    const optionsMap = {
      chargeCode: 'charge_Code',
      tools: 'tool',
      location: 'test_Location',
      pslCompany: 'psL_Company',
      group: 'group',
      resources: 'locationWiseResources'
    };

    const optionKeys = ['chargeCode', 'tools', 'location', 'pslCompany', 'group', 'resources'];

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
  }

  selectOption(field: any, option: string): void {
    const field_name = `${field}Options` as keyof this
    this.new_work_request.get(field)?.setValue(option);
    (this as any)[field_name] = [];

    if (field === 'location') {
      const loc = option.trim().toLowerCase()
      const i = this.allDataRes[0].locationWiseResources.findIndex((item: { loc: string; }) => item.loc.trim().toLowerCase() === loc)
      this.location_index = i
      this.locationwise_resource()
    }

    if (field === 'chargeCode') {
      this.new_work_request.get('chargeCode')?.setValue(option);
      const selected = this.new_work_request.get('chargeCode')?.value;
      if (!this.chargeCodeList.includes(selected)) {
        this.chargeCodeList.push(selected);
        if (this.chargeCodeList.some((item: string) => item.startsWith('HT'))) {
          this.activityCodeShow = true;
          this.new_work_request.get('activityCode')?.setValidators([Validators.required]);
          this.new_work_request.get('activityCode')?.updateValueAndValidity();
        }
      } else {
        this.commonService.displayWarning('Charge Code already exists');
      }
      this.new_work_request.get('chargeCode')?.setValue('');
      (this as any)[field_name] = [];
    }
  }

  toggleSelection(option: string) {
    if (option === 'No data with this search') {
      this.errorMessage('Charge Code', 'chargeCode')
      return
    };

    const index = this.chargeCodeList.indexOf(option);

    if (index > -1) {
      this.chargeCodeList.splice(index, 1);
    } else {
      this.chargeCodeList.push(option);
    }

    const hasHTCode = this.chargeCodeList.some((item: string) => item.startsWith('HT'));
    this.activityCodeShow = hasHTCode;

    const activityCtrl = this.new_work_request.get('activityCode');
    if (hasHTCode) {
      activityCtrl?.setValidators([Validators.required]);
    } else {
      activityCtrl?.clearValidators();
    }
    activityCtrl?.updateValueAndValidity();
    this.new_work_request.get('chargeCode')?.setValue('');
  }

  location_index: any
  locationwise_resource() {
    if (this.location_index !== -1) {
      this.resourcesOptions = this.allDataRes[0].locationWiseResources[this.location_index].res;
      this.new_work_request.get('resources')?.valueChanges.subscribe(value => {
        this.filterResourceOptions(value)
      });
    } else {
      this.new_work_request.get('resources')?.setValue('');
      this.resourcesOptions = [];
      const resourcesControl = this.new_work_request.get('resources');
      resourcesControl?.disable();
      this.commonService.displayWarning('No resources found for this location');
    }
  }

  filterResourceOptions(value: string): void {
    const searchTerm = value.trim().toLowerCase();
    const allOptions = this.allDataRes[0].locationWiseResources[this.location_index].res;
    const matchingOptions = allOptions.filter((option: string) =>
      option.toLowerCase().includes(searchTerm)
    );

    this.resourcesOptions = matchingOptions.length > 0 ? matchingOptions : ['No data with this search'];

    const formControl = this.new_work_request.get('resources');
    if (formControl) {
      const currentValue = formControl.value;

      const resourcesWiseTestProcedure =
        this.allDataRes?.[0]?.resourcesWiseTestProcedure?.find(
          (item: { resource: string }) =>
            item.resource?.trim().toLowerCase() === currentValue?.trim().toLowerCase()
        );

      const resourceWise_TestProcedure =
        resourcesWiseTestProcedure?.res?.[0] === 1 ? true : false;

      const fileAttachmentCtrl = this.new_work_request.get('fileAttachment');
      if (resourceWise_TestProcedure) {
        fileAttachmentCtrl?.setValidators([Validators.required])
      } else {
        fileAttachmentCtrl?.clearValidators()
      }
      fileAttachmentCtrl?.updateValueAndValidity()

      const isValidOption = allOptions.includes(currentValue);
      if (!isValidOption && currentValue) {
        formControl.setErrors({ noMatch: true });
      } else {
        formControl.setErrors(null);
      }
    }
  }

  Is_spinner: boolean = false;
  submit_res: any
  onSubmit() {

    if (this.new_work_request.valid) {

      const selectedType = this.new_work_request.get('Select_Charge_Code_or_Work_Order')?.value;

      if (selectedType === 'chargeCode' && this.chargeCodeList.length === 0) {
        this.commonService.displayWarning('At least one Charge Code is required.');
        return;
      }

      if (selectedType !== 'chargeCode' && this.workOrderList.length === 0) {
        this.commonService.displayWarning('At least one Work Order is required.');
        return;
      }
      if (this.new_work_request.get('duration')?.value === 0) {
        this.commonService.displayWarning('Duration must be greater than 0.')
        return
      }

      if (this.new_work_request.get('activityCode')?.value != '') {
        const activityCodeValue = this.new_work_request.get('activityCode')?.value;

        if (!/^[a-zA-Z0-9]{4}$/.test(activityCodeValue)) {
          this.commonService.displayWarning('Activity Code must be exactly 4 alphanumeric characters.');
          return;
        }
      }
      this.Is_spinner = true
      const body = {

        userId: this.user_id,
        WorkReqNumber: '',
        charge_Code: '',
        charge_Codes: this.new_work_request.get('Select_Charge_Code_or_Work_Order')?.value === 'chargeCode' ? this.chargeCodeList : [],
        activityCode: this.new_work_request.get('activityCode')?.value || '',
        work_Orders: this.new_work_request.get('Select_Charge_Code_or_Work_Order')?.value != 'chargeCode' ? this.workOrderList : [],
        request_Description: this.new_work_request.get('requestDescription')?.value,
        tool: this.new_work_request.get('tools')?.value,
        test_Location: this.new_work_request.get('location')?.value,
        resource: this.new_work_request.get('resources')?.value,
        duration_days: Number(this.new_work_request.get('duration')?.value),
        psL_Company: this.new_work_request.get('pslCompany')?.value,
        group: this.new_work_request.get('group')?.value,
        startDate: null,
        endDate: null,
        lithiumBattery: this.new_work_request.get('lithium_batteries')?.value === true ? true : false,
        lithiumBatteryDescription: this.new_work_request.get('lithium_batteries_description')?.value,
        radiation: this.new_work_request.get('Radiation')?.value === true ? true : false,
        radiationDescription: this.new_work_request.get('Radiation_description')?.value,
        file: this.fileBase64,
        fileName: this.fileName,
      }

      this.api_service.submit_new_work_request(body).subscribe({
        next: (res) => {
          this.submit_res = res

          if (this.submit_res.status) {
            this.Is_spinner = false
            this.new_work_request.reset()
            this.resourcesOptions = [];

            this.local_storage.setDataFormCalender(this.submit_res);
            this.router.navigate([`calendar`, this.submit_res.wRnumber, this.submit_res.taskNumber]);
            this.commonService.displaySuccess("New work request submitted sucessfully. Now select dates as per duration you entered.")
          } else {
            this.commonService.displayWarning("Some error occur please try again.")
            this.Is_spinner = false
          }
        },
        error: (err) => {

          this.Is_spinner = false
          this.commonService.displayWarning(`` + err.message)
          this.commonService.displayWarning('Failed to submit new work request. Please try again later.')
        }
      })

    } else {
      this.new_work_request.markAllAsTouched();
      this.commonService.displayWarning('Please fill all details');
    }
  }

  is_draft_spinner: boolean = false;
  saveAsDraft() {
    const requestDescriptionControl = this.new_work_request.get('requestDescription');
    const locationControl = this.new_work_request.get('location');
    const pslCompanyControl = this.new_work_request.get('pslCompany')
    const groupControl = this.new_work_request.get('group');

    const isrequestDescriptionValid = requestDescriptionControl?.valid;
    const islocationValid = locationControl?.valid;
    const ispslCompanyValid = pslCompanyControl?.valid;
    const isgroupValid = groupControl?.valid;

    if (isrequestDescriptionValid && islocationValid && ispslCompanyValid && isgroupValid) {
      if (this.new_work_request.get('activityCode')?.value != '') {
        const activityCodeValue = this.new_work_request.get('activityCode')?.value;

        if (!/^[a-zA-Z0-9]{4}$/.test(activityCodeValue)) {
          this.commonService.displayWarning('Activity Code must be exactly 4 alphanumeric characters.');
          return;
        }
      }
      this.is_draft_spinner = true
      const body = {

        userId: this.user_id,
        WorkReqNumber: '',
        charge_Code: '',
        charge_Codes: this.new_work_request.get('Select_Charge_Code_or_Work_Order')?.value === 'chargeCode' ? this.chargeCodeList : [],
        activityCode: this.new_work_request.get('activityCode')?.value || '',
        work_Orders: this.new_work_request.get('Select_Charge_Code_or_Work_Order')?.value != 'chargeCode' ? this.workOrderList : [],
        request_Description: this.new_work_request.get('requestDescription')?.value || '',
        tool: this.new_work_request.get('tools')?.value || '',
        test_Location: this.new_work_request.get('location')?.value || '',
        resource: this.new_work_request.get('resources')?.value || '',
        duration_days: Number(this.new_work_request.get('duration')?.value || ''),
        psL_Company: this.new_work_request.get('pslCompany')?.value || '',
        group: this.new_work_request.get('group')?.value || '',
        startDate: null,
        endDate: null,
        lithiumBattery: this.new_work_request.get('lithium_batteries')?.value === true ? true : false,
        lithiumBatteryDescription: this.new_work_request.get('lithium_batteries_description')?.value,
        radiation: this.new_work_request.get('Radiation')?.value === true ? true : false,
        radiationDescription: this.new_work_request.get('Radiation_description')?.value,
        file: this.fileBase64,
        fileName: this.fileName,
      }

      this.api_service.draft_new_work_request(body).subscribe({
        next: (res) => {
          this.submit_res = res

          if (this.submit_res.status) {
            this.is_draft_spinner = false
            this.new_work_request.reset()
            this.resourcesOptions = [];
            this.router.navigate([`work-request`])
            this.commonService.displaySuccess("New work request submitted as draft sucessfully.")
          } else {
            this.commonService.displayWarning("Some error occur please try again.")
            this.is_draft_spinner = false
          }
        },
        error: (err) => {

          this.is_draft_spinner = false
          this.commonService.displayWarning(`` + err.message)
          this.commonService.displayWarning('Failed to submit new work request. Please try again later.')
        }
      })


    } else {

      requestDescriptionControl?.markAsTouched();
      locationControl?.markAsTouched();
      pslCompanyControl?.markAsTouched();
      groupControl?.markAsTouched();
      this.commonService.displayWarning('Please add Location, Request Description, PSL Company & Group to save as draft');
    }
  }

  add_chargeCode() {
    const dialogRef = this.dialog.open(charge_code, {
      data: { user_id: this.user_id },
      width: '300px',
      panelClass: 'custom-dialog-container'
    })
  }

  add_tools() {
    const dialogRef = this.dialog.open(add_tools, {
      data: { user_id: this.user_id },
      width: '300px',
      panelClass: 'custom-dialog-container'
    })
  }

}

@Component({
  selector: 'add_tools',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule
  ],
  template: `
  <div class="container-fluid add_tool">
    <div class="row">
      <div class="col-12">
        <h2>Add New Tool to System</h2>

        <form autocomplete="off">
        <label for="add_tool">Part Number:</label>
        <input type="text" id="add_tool" [(ngModel)] ='new_tool_Value' name="add_tool" placeholder="Add New Tool to System">
        <span><strong>Note:</strong> This request will be sent to an admin, save request as draft until tool is added. Check back in 2-3 days.</span>
        <div class="btn_div">
        <button class="yesbtn" (click)="add_newTool()" *ngIf="!Is_spinner">Request</button>
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
  styleUrl: './new-request-form.component.scss'
})

export class add_tools {

  new_tool_Value = ''
  user_id: any
  constructor(public dialogRef: MatDialogRef<add_tools>,
    private commonService: CommonServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private api_service: AllApiServiceService) {
    this.user_id = data.user_id
  }

  close() {
    this.dialogRef.close()
    this.new_tool_Value = ''
  }

  Is_spinner: boolean = false;
  add_newTool() {
    if (this.new_tool_Value != '') {
      this.Is_spinner = true

      const body = {
        Part_Number: this.new_tool_Value,
        userID: this.user_id
      }
      this.api_service.add_tool(body).subscribe({
        next: (res) => {
          this.Is_spinner = false
          this.new_tool_Value = ''
          this.close()
          this.commonService.displaySuccess("New Tool request submitted sucessfully.")
        }, error: (err) => {
          this.Is_spinner = false
          this.commonService.displayWarning(`` + err.message)
          this.commonService.displayWarning('Failed to submit Tool Request. Please try again later.')
        }
      })
    } else {
      this.commonService.displayWarning("New Tool is required before proceeding.")
    }
  }

}

@Component({
  selector: 'charge_code',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule
  ],
  template: `
  <div class="container-fluid add_tool">
    <div class="row">
      <div class="col-12">
        <h2>Add New Charge Code</h2>

        <form autocomplete="off">
        <label for="add_tool">Charge Code:</label>
        <input type="text" id="add_tool" [(ngModel)] = "charge_code_Value" name="add_tool" placeholder="Add New Charge Code">
        <span><strong>Note:</strong> This request will be sent to an admin, save request as draft until tool is added. Check back in 2-3 days.</span>
        <div class="btn_div">
        <button class="yesbtn" (click)="add_chareCode()" *ngIf="!Is_spinner">Request</button>
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
  styleUrl: './new-request-form.component.scss'
})

export class charge_code {

  charge_code_Value = ''
  user_id: any;
  constructor(public dialogRef: MatDialogRef<charge_code>,
    private commonService: CommonServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private api_service: AllApiServiceService) {
    this.user_id = data.user_id
  }

  close() {
    this.dialogRef.close()
    this.charge_code_Value = ''
  }

  Is_spinner: boolean = false;
  add_chareCode() {
    if (this.charge_code_Value != '') {
      this.Is_spinner = true
      const body = {
        Charge_Code: this.charge_code_Value,
        userID: this.user_id
      }

      this.api_service.add_chargeCode(body).subscribe({
        next: (res) => {
          this.Is_spinner = false
          this.charge_code_Value = ''
          this.close()
          this.commonService.displaySuccess("Charge code request submitted sucessfully.")
        }, error: (err) => {
          this.Is_spinner = false
          this.commonService.displayWarning(`` + err.message)
          this.commonService.displayWarning('Failed to submit Charge Code Request. Please try again later.')
        }

      })
    } else {
      this.commonService.displayWarning("Charge code is required before proceeding.")
    }
  }

}

