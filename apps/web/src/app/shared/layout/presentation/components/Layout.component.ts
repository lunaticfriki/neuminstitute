import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FooterComponent } from './Footer.component';
import { HeaderComponent } from './Header.component';

@Component({
  selector: 'app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeaderComponent, FooterComponent],
  templateUrl: './Layout.component.html',
  host: { class: 'flex min-h-dvh flex-col' },
})
export class LayoutComponent {}
