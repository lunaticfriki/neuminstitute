import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './Header.component.html',
  host: { class: 'block' },
})
export class HeaderComponent {}
