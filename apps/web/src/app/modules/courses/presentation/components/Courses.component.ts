import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-courses',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './Courses.component.html',
})
export class CoursesComponent {}
