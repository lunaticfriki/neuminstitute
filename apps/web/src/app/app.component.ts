import { afterNextRender, Component, DestroyRef, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from './shared/layout/presentation/components/Layout.component';
import { SmoothScrollService } from './shared/scroll/presentation/SmoothScroll.service';

@Component({
  imports: [RouterOutlet, LayoutComponent],
  selector: 'app-root',
  styleUrl: './app.component.css',
  templateUrl: './app.component.html',
})
export class App {
  private readonly smoothScroll = inject(SmoothScrollService);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.smoothScroll.start();
      destroyRef.onDestroy(() => this.smoothScroll.destroy());
    });
  }
}
