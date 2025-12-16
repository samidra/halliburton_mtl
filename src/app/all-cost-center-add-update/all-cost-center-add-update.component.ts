import { Component, Inject, NgZone } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { NgxPaginationModule } from 'ngx-pagination';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog"
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AllApiServiceService } from '../Services/all-api-service.service';
import { CommonServiceService } from '../Services/common-service.service';

@Component({
  selector: 'app-all-cost-center-add-update',
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './all-cost-center-add-update.component.html',
  styleUrl: './all-cost-center-add-update.component.scss'
})
export class AllCostCenterAddUpdateComponent {

  page = 1;
  itemsPerPage: number = 25;
  private pollingInterval: any = null;
  searchText: any;
  constructor(private titleService: Title,
    private api_service: AllApiServiceService,
    private ngZone: NgZone,
    public dialog: MatDialog) {
    this.titleService.setTitle('Add/Update All Cost Center | MTL HALLIBURTON');
  }

  ngOnInit(): void {
    this.startPolling()
  }

  startPolling() {
    this.Get_all_CostCenter()
    this.ngZone.runOutsideAngular(() => {
      this.pollingInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.Get_all_CostCenter()
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
  all_costCenter: any = []
  Get_all_CostCenter() {
    this.api_service.Get_all_CostCenter().subscribe({
      next: (res: any) => {
        this.all_costCenter = res;
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
      return this.all_costCenter;
    }
    const search = this.searchText.toLowerCase();
    return this.all_costCenter.filter((item: any) => 
      Object.values(item)
        .some((value: any) => {
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(search);
      })
    );
  }

  add_update(action_type: any, costCenterDetails: any) {

    const dialogRef = this.dialog.open(cost_center, {
      data: { action_type: action_type, 
        costCenterDetails: action_type === 'Update Cost Center' ? costCenterDetails : '' },
      width: '500px',
      panelClass: 'custom-dialog-container'
    })

  }

  delete_costCenter(networkNumber:any,costCenter_name: any, costCenterID: any) {
      const dialogRef = this.dialog.open(delete_costCenter, {
        data: {
          costCenter_name: `${networkNumber}-${costCenter_name}`,
          costCenterID: costCenterID
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

// Cost Center

@Component({
  selector: 'cost_center',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  template: `
  <div class="container-fluid common_dialog">
    <div class="row">
        <div class="col-12 p-1">
            <h2>Network Number Information</h2>

            <form [formGroup]="cost_center" (ngSubmit)="onSubmit()">

                <div class="form-group mt-1">
                    <div class="form_field">
                        <label for="network_num">Network Number:</label>
                        <input type="text" placeholder="Network Number" id="network_num" class="form-control"
                            formControlName="network_num" />
                    </div>
                    <div *ngIf="cost_center.get('network_num')?.invalid && cost_center.get('network_num')?.touched"
                        class="text-danger error">
                        Network Number is required.
                    </div>
                </div>

                <div class="form-group mt-1">
                    <div class="form_field">
                        <label for="discription">Discription:</label>
                        <input type="text" placeholder="Write Discription" id="discription" class="form-control"
                            formControlName="discription" />
                    </div>
                    <div *ngIf="cost_center.get('discription')?.invalid && cost_center.get('discription')?.touched"
                        class="text-danger error">
                        Discription is required.
                    </div>
                </div>

                <div style="display: flex; align-items: center; margin-top:10px">

                    <div class="form-group" style="width: 50%;">
                        <div class="form_field">
                            <div class="d-flex">
                                <label for="available_for_use">Available for Use?:</label>
                                <input type="checkbox" checked id="available_for_use" class="form-control"
                                    formControlName="available_for_use" class="mx-3">
                            </div>
                        </div>
                    </div>

                    <div class="form-group" style="width: 50%;">
                        <div class="form_field">
                            <div class="d-flex">
                                <label for="project_cost_number">Is this a Project Cost Number?:</label>
                                <input type="checkbox" id="project_cost_number" class="form-control"
                                    formControlName="project_cost_number" class="mx-3">
                            </div>
                        </div>
                    </div>

                </div>

                <div class="btn_div">
                    <button type="submit" *ngIf="!Is_spinner" class="yesbtn">{{this.action_type === 'Update Cost Center'
                        ?
                        'Update Cost Center' : 'Add Cost Center'}}</button>
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
  styleUrl: './all-cost-center-add-update.component.scss'
})

export class cost_center {
  action_type: any
  cost_center !: FormGroup
  cost_centerDetail: any
  networkNumberID = 0

  constructor(private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private api_service: AllApiServiceService,
    public common_service: CommonServiceService,
    public dialogRef: MatDialogRef<cost_center>) {

    this.cost_center = this.fb.group({
      network_num: ['', Validators.required],
      discription: ['', Validators.required],
      available_for_use: [true],
      project_cost_number: [false],
    });

    this.action_type = data.action_type
    if (this.action_type === 'Update Cost Center') {
      this.cost_centerDetail = data?.costCenterDetails
      this.networkNumberID = this.cost_centerDetail?.networkNumberID,
      this.cost_center.get('network_num')?.setValue(this.cost_centerDetail.networkNumber),
      this.cost_center.get('discription')?.setValue(this.cost_centerDetail.description),
      this.cost_center.get('available_for_use')?.setValue(this.cost_centerDetail.availableForUse),
      this.cost_center.get('project_cost_number')?.setValue(this.cost_centerDetail.projectCostNumber)
    }
  }

  ngOnInit(): void { }

  Is_spinner: boolean = false
  onSubmit() {
    if (this.cost_center.valid) {
      this.Is_spinner = true
      const body = {
        "networkNumberID": Number(this.networkNumberID),
        "networkNumber": this.cost_center.get('network_num')?.value,
        "description": this.cost_center.get('discription')?.value,
        "availableForUse": this.cost_center.get('available_for_use')?.value,
        "projectCostNumber": this.cost_center.get('project_cost_number')?.value,
        "userID": "H317697"
      }
      if (this.action_type != 'Update Cost Center') {
        this.Add_new_CostCenter(body);
      } else if (this.action_type === 'Update Cost Center') {
        this.update_costCenter(body);
      }
      console.log('Form Submitted', body);
    } else {
      this.cost_center.markAllAsTouched();
      console.log('Form is not valid');
    }
  }

  Add_new_CostCenter(body: any) {
    this.api_service.Add_new_CostCenter(body).subscribe({
      next: (res: any) => {
        this.Is_spinner = false;
        this.dialogRef.close();
        this.common_service.displaySuccess('Cost Center added Successfully.');
      },
      error: (err) => {
        this.Is_spinner = false;
        this.common_service.displayWarning('Failed to add. Please try again');
      }
    });
  }

  update_costCenter(body: any) {
    this.api_service.update_costCenter(body).subscribe({
      next: (res: any) => {
        this.Is_spinner = false;
        this.dialogRef.close();
        this.common_service.displaySuccess('Cost Center updated Successfully.');
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

// Delete Cost Center

@Component({
  selector: 'delete_costCenter',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule
  ],
  template: `
  <div class="container-fluid delete_modal">
    <div class="row">
      <div class="col-12">
        <h2>Delete Cost Center Confirmation</h2>

        <form>
        <label>Are you sure you want to delete tool: <strong>{{costCenter_name}}</strong>? <br> This action cannot be undone.</label>
        <div class="btn_div">
        <button class="yesbtn" (click)="delete_costCenter()" *ngIf="!Is_spinner">Yes, Delete</button>
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
  styleUrl: './all-cost-center-add-update.component.scss'
})

export class delete_costCenter {

  costCenter_name = ''
  costCenterID = ''
  constructor(public dialogRef: MatDialogRef<delete_costCenter>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private commonService: CommonServiceService,
    private api_service: AllApiServiceService) {
    this.costCenter_name = data.costCenter_name
    this.costCenterID = data.costCenterID
  }

  close() {
    this.dialogRef.close()
    this.costCenter_name = ''
  }

  Is_spinner: boolean = false;
  delete_costCenter() {
    if (this.costCenter_name != '') {
      this.Is_spinner = true
      this.api_service.delete_costCenter(this.costCenterID).subscribe({
        next: (res) => {
          this.Is_spinner = false
          this.costCenter_name = ''
          this.close()
          this.commonService.displaySuccess("Cost Center deleted sucessfully.")
        }, error: (err) => {
          this.Is_spinner = false
          console.log(err.message)
          this.commonService.displayWarning('Failed to delete cost center. Please try again later.')
        }
      })
    }
  }

}