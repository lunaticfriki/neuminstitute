import { afterNextRender, Directive, DestroyRef, ElementRef, Injector } from '@angular/core'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const FADE_DURATION_S = 1
const FADE_STAGGER_S = 0.15
const START_POSITION = 'top 60%'

@Directive({
  selector: '[appScrollFade]',
})
export class ScrollFadeDirective {
  constructor(
    private readonly elementRef: ElementRef<HTMLElement>,
    private readonly destroyRef: DestroyRef,
    private readonly injector: Injector,
  ) {
    afterNextRender(
      () => {
        this.setUp()
      },
      { injector: this.injector },
    )
  }

  private setUp(): void {
    const section = this.elementRef.nativeElement
    const targets = section.querySelectorAll('[data-fade]')
    gsap.set(targets, { opacity: 0 })

    const fade = gsap.to(targets, {
      opacity: 1,
      duration: FADE_DURATION_S,
      stagger: FADE_STAGGER_S,
      ease: 'power1.out',
      paused: true,
    })

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: START_POSITION,
      end: 'bottom top',
      onEnter: () => fade.restart(),
      onEnterBack: () => fade.restart(),
      onLeave: () => fade.pause(0),
      onLeaveBack: () => fade.pause(0),
    })

    this.destroyRef.onDestroy(() => {
      trigger.kill()
      fade.kill()
    })
  }
}
