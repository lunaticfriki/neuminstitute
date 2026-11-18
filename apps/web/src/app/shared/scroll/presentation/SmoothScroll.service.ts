import { Injectable } from '@angular/core'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

@Injectable({ providedIn: 'root' })
export class SmoothScrollService {
  private lenis: Lenis | null = null
  private readonly syncGsapTicker = (time: number) => this.lenis?.raf(time * 1000)

  start(): void {
    if (this.lenis) {
      return
    }

    this.lenis = new Lenis()
    this.lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(this.syncGsapTicker)
    gsap.ticker.lagSmoothing(0)
  }

  destroy(): void {
    gsap.ticker.remove(this.syncGsapTicker)
    this.lenis?.destroy()
    this.lenis = null
  }
}
