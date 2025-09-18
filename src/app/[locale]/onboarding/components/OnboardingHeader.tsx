'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { RotateCcw } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LanguageSelector } from '@/components/LanguageSelector'
import { WhiteBoarLogo } from '@/components/WhiteBoarLogo'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useOnboardingStore } from '@/stores/onboarding'
import { useToast } from '@/hooks/use-toast'

export function OnboardingHeader() {
  const [showRestartDialog, setShowRestartDialog] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const { clearSession } = useOnboardingStore()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const { toast } = useToast()

  const handleRestartClick = () => {
    setShowRestartDialog(true)
  }

  const handleRestartConfirm = async () => {
    setIsRestarting(true)

    try {
      // Clear the onboarding session state
      clearSession()

      // Navigate to onboarding welcome page with current locale
      router.push(`/${locale}/onboarding`)

      // Show success message
      toast({
        title: "Onboarding restarted",
        description: "You've been taken back to the beginning.",
      })
    } catch (error) {
      console.error('Failed to restart onboarding:', error)
      toast({
        title: "Error",
        description: "Failed to restart onboarding. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRestarting(false)
      setShowRestartDialog(false)
    }
  }

  const handleRestartCancel = () => {
    setShowRestartDialog(false)
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/70 dark:bg-black/70 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-800/20">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center space-x-3 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2">
                <div className="h-20 w-20 flex items-center justify-center">
                  <WhiteBoarLogo
                    width={100}
                    height={100}
                    className="text-accent dark:text-accent"
                  />
                </div>
                <span className="font-heading font-bold text-lg text-gray-900 dark:text-white">
                  WhiteBoar
                </span>
              </Link>
            </div>

            {/* Controls: Restart, Language, Theme */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRestartClick}
                disabled={isRestarting}
                data-testid="restart-onboarding"
                className="text-gray-700 dark:text-white hover:text-gray-900 dark:hover:text-accent"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Restart</span>
              </Button>
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Restart Confirmation Dialog */}
      <AlertDialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Over?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all your progress and return you to the beginning of the onboarding process.
              Are you sure you want to restart?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleRestartCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestartConfirm}
              disabled={isRestarting}
              data-testid="confirm-restart"
            >
              {isRestarting ? "Restarting..." : "Start Over"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}