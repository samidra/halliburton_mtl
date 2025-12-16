import { Component, Inject, NgZone } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { NgxPaginationModule } from 'ngx-pagination';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog"
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AllApiServiceService } from '../Services/all-api-service.service';
import { CommonServiceService } from '../Services/common-service.service';

@Component({
  selector: 'app-all-tools-add-update',
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './all-tools-add-update.component.html',
  styleUrl: './all-tools-add-update.component.scss'
})

export class AllToolsAddUpdateComponent {
  private pollingInterval: any = null;
  page = 1;
  itemsPerPage: number = 25;
  searchText: any;
  constructor(private titleService: Title,
    private api_service: AllApiServiceService,
    private ngZone: NgZone,
    public dialog: MatDialog) {
    this.titleService.setTitle('All Tools | MTL HALLIBURTON');
  }

  ngOnInit(): void {
    this.startPolling()
  }

  startPolling() {
    this.Get_all_Tool()
    this.ngZone.runOutsideAngular(() => {
      this.pollingInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.Get_all_Tool()
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
  all_tools: any = []
  Get_all_Tool() {
    this.api_service.Get_all_Tool().subscribe({
      next: (res: any) => {
        console.log(res)
        this.all_tools = res;
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
      return this.all_tools;
    }
    const search = this.searchText.toLowerCase();

    return this.all_tools.filter((item:any)=> 
    Object.values(item).some((value: any) => {
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(search);
      })
    )
    // return this.all_tools.filter((item: any) => {
    //   const tool = item?.description
    //   return tool.toString().toLowerCase().includes(search)
    // });
  }

  add_update(action_type: any, toolDetails: any) {
    if (action_type === 'Update tool') {
      this.isLoading = true
    }
    const dialogRef = this.dialog.open(tool, {
      data: { action_type: action_type, toolDetails: action_type === 'Update tool' ? toolDetails : '' },
      width: '500px',
      panelClass: 'custom-dialog-container'
    })

    dialogRef.afterClosed().subscribe(result => {
      this.isLoading = true
      this.startPolling()
      this.searchText = ''
    });

  }

  delete_tool(tool: any, toolID: any) {
    const dialogRef = this.dialog.open(delete_tool, {
      data: {
        tool: tool,
        toolID: toolID
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

// Tool

@Component({
  selector: 'tool',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  template: `
  <div class="container-fluid common_dialog">
    <div class="row">
        <div class="col-12">
            <h2>{{this.action_type === 'Update tool' ? 'Update Tool' : 'Add New Tool'}}</h2>

            <form [formGroup]="tool_form" (ngSubmit)="onSubmit()">

                <div class="form-group border p-1 pt-0">
                    <div class="form_field">
                        <label for="tool">Tool: </label>
                        <input type="text" id="tool" class="form-control" placeholder="Enter Tool Name"
                            formControlName="tool">
                    </div>

                    <div *ngIf="tool_form.get('tool')?.invalid && tool_form.get('tool')?.touched"
                        class="text-danger error">
                        Tool is required.
                    </div>
                </div>

                <!-- <h5>Tool Information</h5>

        <div class="form-group mt-1">
          <div class="form_field">
              <label for="tool_description">Tool Description (CWI# - CWI Description [if applicable]):</label>
              <input type="text" placeholder="Tool Description (CWI# - CWI Description [if applicable])" id="tool_description" class="form-control"
                  formControlName="tool_description" />
          </div>
          <div *ngIf="tool_form.get('tool_description')?.invalid && tool_form.get('tool_description')?.touched"
              class="text-danger error">
              Tool Description is required.
          </div>
        </div> -->

                <div class="btn_div">
                    <button type="submit" *ngIf="!Is_spinner" class="yesbtn">{{this.action_type === 'Update tool' ?
                        'Update Tool' : 'Add Tool'}}</button>
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
  styleUrl: './all-tools-add-update.component.scss'
})

export class tool {

  action_type: any
  tool_form !: FormGroup
  toolID: any
  constructor(private fb: FormBuilder,
    public dialogRef: MatDialogRef<tool>,
    private api_service: AllApiServiceService,
    public common_service: CommonServiceService,
    @Inject(MAT_DIALOG_DATA) public data: any,) {

    this.tool_form = this.fb.group({
      tool: ['', Validators.required]
    });

    this.action_type = data.action_type
    if (this.action_type != 'Add tool') {
      this.toolID = data?.toolDetails?.toolID
      const tool = data?.toolDetails?.description
      // alert(this.toolID+' '+ tool)
      this.tool_form.get('tool')?.setValue(tool)
    }
  }

  ngOnInit(): void { }

  Is_spinner: boolean = false
  onSubmit() {
    if (this.tool_form.valid) {
      this.Is_spinner = true
      const body = {
        "toolID": this.action_type === 'Update tool' ? Number(this.toolID) : 0,
        "description": this.tool_form.get('tool')?.value,
        "userID": "H317697"
      }

      if (this.action_type != 'Update tool') {
        this.Add_new_Tool(body);
      } else if (this.action_type === 'Update tool') {
        this.update_new_Tool(body);
      }

    } else {
      this.tool_form.markAllAsTouched();
      console.log('Form is not valid');
    }
  }

  Add_new_Tool(body: any) {
    this.api_service.Add_new_Tool(body).subscribe({
      next: (res: any) => {
        this.Is_spinner = false;
        this.dialogRef.close();
        this.common_service.displaySuccess('Tool added Successfully.');
      },
      error: (err) => {
        this.Is_spinner = false;
        this.common_service.displayWarning('Failed to add. Please try again');
      }
    });
  }

  update_new_Tool(body: any) {
    this.api_service.update_new_Tool(body).subscribe({
      next: (res: any) => {
        this.Is_spinner = false;
        this.dialogRef.close();
        this.common_service.displaySuccess('Tool updated Successfully.');
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

// Delete Tool

@Component({
  selector: 'delete_tool',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule
  ],
  template: `
  <div class="container-fluid delete_modal">
    <div class="row">
      <div class="col-12">
        <h2>Delete Tool Confirmation</h2>

        <form>
        <label>Are you sure you want to delete tool: <strong>{{tool_name}}</strong>? <br> This action cannot be undone.</label>
        <div class="btn_div">
        <button class="yesbtn" (click)="delete_tool()" *ngIf="!Is_spinner">Yes, Delete</button>
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
  styleUrl: './all-tools-add-update.component.scss'
})

export class delete_tool {

  tool_name = ''
  toolID = ''
  constructor(public dialogRef: MatDialogRef<delete_tool>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private commonService: CommonServiceService,
    private api_service: AllApiServiceService) {
    this.tool_name = data.tool
    this.toolID = data.toolID
  }

  close() {
    this.dialogRef.close()
    this.tool_name = ''
  }

  Is_spinner: boolean = false;
  delete_tool() {
    if (this.tool_name != '') {
      this.Is_spinner = true
      this.api_service.delete_Tool(this.toolID).subscribe({
        next: (res) => {
          this.Is_spinner = false
          this.tool_name = ''
          this.close()
          this.commonService.displaySuccess("Tool deleted sucessfully.")
        }, error: (err) => {
          this.Is_spinner = false
          console.log(err.message)
          this.commonService.displayWarning('Failed to delete tool. Please try again later.')
        }
      })
    }
  }

}