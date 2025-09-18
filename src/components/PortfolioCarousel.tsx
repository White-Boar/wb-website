"use client"

import * as React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { motion, useReducedMotion } from "framer-motion"
import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { fadeInUp, slideUp } from "../../context/design-system/motion/variants"

const portfolioItems = [
  {
    id: 1,
    title: "TechCorp Solutions",
    subtitle: "SaaS Platform",
    image: "/portfolio/project-1.png"
  },
  {
    id: 2,
    title: "Green Energy Co",
    subtitle: "Corporate Website",
    image: "/portfolio/project-2.png"
  },
  {
    id: 3,
    title: "Fashion Boutique",
    subtitle: "E-commerce Store",
    image: "/portfolio/project-3.png"
  },
  {
    id: 4,
    title: "Local Restaurant",
    subtitle: "Online Presence",
    image: "/portfolio/project-4.png"
  },
  {
    id: 5,
    title: "Fitness Studio",
    subtitle: "Booking Platform",
    image: "/portfolio/project-5.png"
  },
  {
    id: 6,
    title: "Creative Agency",
    subtitle: "Portfolio Site",
    image: "/portfolio/project-6.png"
  }
]

export function PortfolioCarousel() {
  const t = useTranslations('portfolio')
  const shouldReduce = useReducedMotion()
  
  const plugin = React.useRef(
    Autoplay({ delay: 7000, stopOnInteraction: true })
  )

  const variants = shouldReduce ? {} : {
    title: fadeInUp,
    carousel: slideUp
  }

  return (
    <section id="portfolio" className="py-24 bg-background">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4"
            variants={variants.title}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
          >
            {t('title')}
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            variants={variants.title}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
          >
            {t('subtitle')}
          </motion.p>
        </div>

        <motion.div 
          className="relative"
          variants={variants.carousel}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          <Carousel
            plugins={[plugin.current]}
            className="w-full max-w-5xl mx-auto"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {portfolioItems.map((item) => (
                <CarouselItem key={item.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          src={item.image}
                          alt={`${item.title} - ${item.subtitle}`}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 flex flex-col justify-end p-6 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <h3 className="font-heading text-xl font-semibold mb-1">
                            {item.title}
                          </h3>
                          <p className="text-gray-200">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </motion.div>
      </div>
    </section>
  )
}