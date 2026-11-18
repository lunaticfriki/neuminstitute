import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './Footer.component.html',
  host: { class: 'block' },
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
