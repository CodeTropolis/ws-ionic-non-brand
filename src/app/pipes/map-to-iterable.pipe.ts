import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mapToIterable'
})
export class MapToIterablePipe implements PipeTransform {

  transform(dict: Object) {
    let a = [];
    for (const key in dict) {
      if (dict.hasOwnProperty(key)) {
        a.push({key, val: dict[key]});
      }
    }
    return a;
  }

}
