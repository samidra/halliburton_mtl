import { Component, Inject, NgZone } from '@angular/core';
import { CommonModule, } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { NgxPaginationModule } from 'ngx-pagination';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog"
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AllApiServiceService } from '../Services/all-api-service.service';
import { CommonServiceService } from '../Services/common-service.service';
@Component({
  selector: 'app-all-user',
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './all-user.component.html',
  styleUrl: './all-user.component.scss'
})
export class AllUserComponent {
  private pollingInterval: any = null;
  page = 1;
  itemsPerPage: number = 25;
  searchText: any;
  constructor(private titleService: Title,
    private api_service: AllApiServiceService,
    public ngzone: NgZone,
    public dialog: MatDialog) {
    this.titleService.setTitle('Add/Update All Users | MTL HALLIBURTON');
  }

  start_polling() {
    this.Get_all_User()
    this.ngzone.runOutsideAngular(() => {
      this.pollingInterval = setInterval(() => {
        this.ngzone.run(() => {
          this.Get_all_User()
        })
      }, 5000)
    })
  }

  ngOnInit(): void {
    this.start_polling()
  }

  ngOnDestroy(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
      console.log('Component destroyed. Polling stopped.');
    }
  }

  isLoading: boolean = true;
  all_users: any = []
  Get_all_User() {
    this.api_service.Get_all_User().subscribe({
      next: (res: any) => {
        // console.log(res)
        this.all_users = res;
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
      return this.all_users;
    }
    const search = this.searchText.toLowerCase();
    return this.all_users.filter((item: any) =>
      Object.values(item).some((value: any) => {
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(search);
      })
    );
  }

  Is_spinner: boolean = false
  add_update(action_type: any, user_detail: any) {
    if (action_type === 'Add user') {
      this.Is_spinner = true
    } else {
      this.isLoading = true;
    
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
    }
    const dialogRef = this.dialog.open(user_access, {
      data: { action_type: action_type, data: action_type != 'Add user' ? user_detail : '' },
      width: '500px',
      panelClass: 'custom-dialog-container',
      disableClose: false
    })

    dialogRef.afterClosed().subscribe(result => {
      this.Is_spinner = false
      this.isLoading = true
      this.start_polling()
    });

  }

  delete_user(userName: any, userId: any) {
    const dialogRef = this.dialog.open(delete_user, {
      data: {
        userName: userName,
        userId: userId
      },
      width: '300px',
      panelClass: 'custom-dialog-container'
    })

    dialogRef.afterClosed().subscribe(result => {
      this.isLoading = true
      this.start_polling()
    })
  }

}

// User Access

@Component({
  selector: 'user_access',
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  template: `
  <div class="container-fluid common_dialog">
    <div class="row">
      <div class="col-12">
        <h2>{{this.action_type === 'Add user' ? 'Add User' : 'Update User'}}</h2>

    <form [formGroup]="user_access" (ngSubmit)="onSubmit()">
       <div class="form-group border p-1 pt-0">
           <div class="form_field">
               <label for="user_id">HAL ID (Example H00000):</label>
                <input type="text" id="user_id" name="user_id" class="form-control" formControlName="user_id"
                    placeholder="Enter HAL ID (Example H00000)"
                    [readOnly]="action_type === 'Add user' ? false : true">
                <div *ngIf="user_access.get('user_id')?.invalid && user_access.get('user_id')?.touched"
               class="text-danger error">
               Hall Id is required.
               </div>
                <hr style="margin-top: 12px; width:90%">

                 <div class="form-group">
           <div class="form_field">
               <label for="access_type">Access Level:</label>
               <select id="access_type" class="form-control form-select" formControlName="access_type">
                   <option value="" disabled selected>Select Access Type</option>
                   <option *ngFor="let option of user_type" [value]="option">{{ option }}</option>
               </select>
           </div>
           <div *ngIf="user_access.get('access_type')?.invalid && user_access.get('access_type')?.touched"
               class="text-danger error">
               Access Type is required.
           </div>
       </div>
           </div>
       </div>
       <div class="btn_div">
           <button type="submit" class="yesbtn" *ngIf="!Is_spinner">
            {{this.action_type === 'Add user' ? 'Add User' : 'Update User'}}
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
  styleUrl: './all-user.component.scss'
})

export class user_access {

  user_type = ['User', 'Lead', 'Tech', 'Admin', 'Inventory', 'Unknown'];
  user_access !: FormGroup;
  action_type: any
  user_detail: any
  constructor(private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private api_service: AllApiServiceService,
    public common_service: CommonServiceService,
    public dialogRef: MatDialogRef<user_access>) {
    this.user_access = this.fb.group({
      user_id: ['', Validators.required],
      access_type: ['', Validators.required]
    });
    this.action_type = data.action_type
    if (this.action_type != 'Add user') {
      this.user_detail = data?.data
      this.user_access.get('user_id')?.setValue(this.user_detail?.userId)
      this.user_access.get('access_type')?.setValue(this.user_detail?.roleName)
    }
  }

  ngOnInit(): void { }

  Is_spinner: boolean = false
  onSubmit() {
    if (this.user_access.valid) {
      console.log('Form Submitted', this.user_access.value);
      const body = {
        userId: this.user_access.get('user_id')?.value,
        userName: this.action_type === 'Update user' ? this.user_detail.userName : '',
        email: this.action_type === 'Update user' ? this.user_detail.email : '',
        location: this.action_type === 'Update user' ? this.user_detail.location : '',
        roleName: this.user_access.get('access_type')?.value
      }
       if (this.action_type != 'Update user') {
        this.Add_new_User(body);  
      } else if (this.action_type === 'Update user') {
        this.update_new_User(body);  
      }
    } else {
      this.user_access.markAllAsTouched();
      this.common_service.displayWarning('Form is not valid.Please fill all required details');
    }
  }

  Add_new_User(body: any) {
    this.api_service.Add_new_User(body).subscribe({
      next: (res: any) => {
        this.Is_spinner = false;
        this.dialogRef.close();
        this.common_service.displaySuccess('User added Successfully.');
      },
      error: (err) => {
        this.Is_spinner = false;
        this.common_service.displayWarning('Failed to add. Please try again');
      }
    });
  }

  update_new_User(body: any) {
    this.api_service.update_new_User(body).subscribe({
      next: (res: any) => {
        this.Is_spinner = false;
        this.dialogRef.close();
        this.common_service.displaySuccess('User updated Successfully.');
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
  selector: 'delete_user',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule
  ],
  template: `
  <div class="container-fluid common_list_modal">
    <div class="row">
      <div class="col-12">
        <h2>Delete User Confirmation</h2>

        <form>
        <label>Are you sure you want to delete user: <strong>{{userName}}</strong>? <br> This action cannot be undone.</label>
        <div class="btn_div">
        <button class="yesbtn" (click)="delete_User()" *ngIf="!Is_spinner">Yes, Delete</button>
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
  styleUrl: './all-user.component.scss'
})

export class delete_user {

  userName = ''
  userId = ''
  constructor(public dialogRef: MatDialogRef<delete_user>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private commonService: CommonServiceService,
    private api_service: AllApiServiceService) {
    this.userName = data.userName
    this.userId = data.userId
  }

  close() {
    this.dialogRef.close()
    this.userName = ''
  }

  Is_spinner: boolean = false;
  delete_User() {
    if (this.userName != '') {
      this.Is_spinner = true
      this.api_service.delete_User(this.userId).subscribe({
        next: (res) => {
          this.Is_spinner = false
          this.userName = ''
          this.close()
          this.commonService.displaySuccess("User deleted sucessfully.")
        }, error: (err) => {
          this.Is_spinner = false
          console.log(err.message)
          this.commonService.displayWarning('Failed to delete User. Please try again later.')
        }
      })
    }
  }

}