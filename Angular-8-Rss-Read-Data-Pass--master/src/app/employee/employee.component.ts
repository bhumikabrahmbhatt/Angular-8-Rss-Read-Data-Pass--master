import { HttpClientService, Employee } from '../service/http-client.service';

import { Component, OnInit, HostListener, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Post } from '../models';
import { map, switchMap, tap, finalize } from 'rxjs/operators';
import { CoreService } from '../core.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-employee',
  templateUrl: 'employee.component.html',
  
})
export class EmployeeComponent implements OnInit {

  newPosts: Post[] = [];
  posts: Post[] = [];

  loading: boolean = false;
  showGetNewsButton: boolean = true;
  url: string = '';
  error: any = null;

  @HostListener('window:scroll', []) onWindowScroll() {
    const offset = window.pageYOffset
      || document.documentElement.scrollTop
      || document.body.scrollTop
      || 0;
      this.showGetNewsButton = offset < 100;
  }
  constructor(
    private coreService: CoreService,
    private route: ActivatedRoute,
    private http: HttpClient) {
  }

  ngOnInit() {
    this.error = '';
    this.route.params
      .pipe(
        map(params => decodeURIComponent(params['url'])),
        tap(url => this.url = url),
        switchMap(url => this.coreService.getLocalPosts(url))
      )
      .subscribe(posts => this.posts = posts);

  }

getNews() {
    this.loading = true;
    this.coreService.getNewPosts(this.url)
      .pipe(finalize(() => this.loading = false))
      .subscribe(newPosts => {

      //&&&&&&&get
        for(let o of newPosts){
          o.updatedDate=o.pubDate;
          o.publishedDate=o.isoDate;
        this.http.post("http://localhost:8080/rssdata/create",o)
      .subscribe(data => console.log("dtaa....",data), error => console.log(error));
      
}

        const oldPubDates = this.posts.map(post => post.isoDate);

        this.newPosts = newPosts.filter(post => !oldPubDates.includes(post.isoDate));

        const t = 30 * 24 * 3600 * 1000; // 30 days

        const postsForSaving = [...this.newPosts, ...this.posts]
          .filter((post: Post) => (+new Date() - +new Date(post.isoDate)) < t);

        this.coreService.saveLocalPosts(this.url, postsForSaving);
      }, e => this.error = e);

  }

  clear() {
    if (confirm(`Clear this feed?`)) {
      this.newPosts = [];
      this.posts = [];
      this.coreService.clear(this.url);
    }
  }

}
