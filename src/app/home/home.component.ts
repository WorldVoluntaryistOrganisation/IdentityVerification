import { CommonModule, KeyValuePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DataService } from '../data.service';
import { VerifiableCredential } from '@web5/credentials';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, KeyValuePipe, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  sanitizer = inject(DomSanitizer);

  data = inject(DataService);

  route = inject(ActivatedRoute);

  title = 'app';

  // entries: any[] = [];

  // groups: { [key: string]: any } = {};

  loading = true;

  did: string | null = '';

  async load(did: string | null) {
    if (!did) {
      console.warn('No DID provided');
      return;
    }

    if (typeof Web5 !== 'undefined') {
      console.log('Web5 is available:', Web5);
      // You can now use Web5 here
    } else {
      console.error('Web5 is not available');
    }

    const { web5, did: userDid } = await Web5.Web5.connect();
    console.log(web5, userDid);

    // const urlParams = new URLSearchParams(window.location.search);
    // const did = urlParams.get('did');

    console.log('From DID:', did);

    const response = await web5.dwn.records.query({
      from: did,
      message: {
        filter: {
          tags: {
            type: 'FreeID',
          },
          schema: 'IdentityCredential',
          dataFormat: 'application/vc+jwt',
        },
      },
    });

    console.log('Response:', response.records);

    // Reset all previously loaded data.
    this.data.groups = {};

    if (response.records) {
      for (const record of response.records) {
        console.log('REcord:', record);

        const jwt_vc = await record.data.text();
        const vc = VerifiableCredential.parseJwt({ vcJwt: jwt_vc });

        this.vc = vc;
        this.vcData = vc.vcDataModel.credentialSubject;

        console.log(this.vc);

        // const entry = {
        //   record,
        //   data,
        //   id: record.id,
        // };

        // for (const label of record.tags['labels'] as []) {
        //   if (label == null || label == '') {
        //     continue;
        //   }

        //   if (this.data.groups[label] == null) {
        //     this.data.groups[label] = [];
        //   }

        //   this.data.groups[label].push(entry);
        // }
      }
    }

    this.loading = false;
    this.data.loaded = true;
    this.data.complete = true;

    console.log(this.data.groups);
  }

  vc: VerifiableCredential | null = null;
  vcData: any = null;

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  ngOnInit() {
    this.did = this.route.snapshot.queryParamMap.get('did');
    this.load(this.did);
  }
}
