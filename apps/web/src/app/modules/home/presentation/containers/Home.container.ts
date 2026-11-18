import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ContactComponent } from '../../../contact/presentation/components/Contact.component';
import { CoursesComponent } from '../../../courses/presentation/components/Courses.component';
import { MethodologyComponent } from '../../../methodology/presentation/components/Methodology.component';
import { TeamComponent } from '../../../team/presentation/components/Team.component';
import { HeroComponent } from '../components/Hero.component';

@Component({
  selector: 'app-home-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeroComponent, MethodologyComponent, CoursesComponent, TeamComponent, ContactComponent],
  templateUrl: './Home.container.html',
})
export class HomeContainer {}
