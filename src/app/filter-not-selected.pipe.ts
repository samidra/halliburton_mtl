import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterNotSelected'
})
export class FilterNotSelectedPipe implements PipeTransform {

  transform(items: any[], selected: any[]): any[] {
    if (!items) return [];
    if (!selected || selected.length === 0) return items;

    const selectedIds = selected.map(item => item.taskID);

    return items.filter(
      item => !selectedIds.includes(item.taskID)
    );
  }

}