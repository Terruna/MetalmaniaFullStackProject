import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(public httpCalls:HttpClient){

  }

  data(){
    return this.httpCalls.get('https://localhost:7015/api/Products')
  }

  userData(){
    return this.httpCalls.get('https://localhost:7015/api/User/Me')
  }

  getReviews() {
  return this.httpCalls.get<any>('https://localhost:7015/api/Reviews');
}

}
