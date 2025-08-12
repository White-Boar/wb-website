"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const addOns = [
  {
    id: 'analytics',
    name: 'Advanced Analytics',
    price: '€15/month',
    description: 'Detailed visitor insights and conversion tracking'
  },
  {
    id: 'support',
    name: 'Priority Support',
    price: '€25/month', 
    description: '24/7 priority support with 1-hour response time'
  },
  {
    id: 'content',
    name: 'Content Updates',
    price: '€50/month',
    description: 'Monthly content updates and blog posts'
  },
  {
    id: 'seo',
    name: 'SEO Optimization',
    price: '€35/month',
    description: 'Advanced SEO tools and monthly reports'
  }
]

export function AddOnsPopover() {
  const t = useTranslations('pricing')

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-4">
          <Plus className="mr-2 h-4 w-4" />
          {t('addons')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t('addons')}</DialogTitle>
          <DialogDescription>
            {t('addonsDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {addOns.map((addon) => (
            <div
              key={addon.id}
              className="grid grid-cols-4 items-center gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <div className="col-span-3">
                <h4 className="font-medium">{addon.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {addon.description}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-accent">{addon.price}</p>
                <Button size="sm" variant="outline" className="mt-2">
                  Add
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}