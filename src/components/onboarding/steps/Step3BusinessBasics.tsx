'use client'

import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Building2, MapPin, Phone, Globe, Hash } from 'lucide-react'

import { TextInput } from '@/components/onboarding/form-fields/TextInput'
import { PhoneInput } from '@/components/onboarding/form-fields/PhoneInput'
import { DropdownInput } from '@/components/onboarding/form-fields/DropdownInput'
import { AddressAutocomplete } from '@/components/onboarding/AddressAutocomplete'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StepComponentProps } from './index'

// Sample industries for dropdown
const industries = [
  { value: 'restaurant', label: 'Restaurant & Food Service', description: 'Restaurants, cafes, catering' },
  { value: 'retail', label: 'Retail & E-commerce', description: 'Shops, online stores' },
  { value: 'professional', label: 'Professional Services', description: 'Legal, consulting, accounting' },
  { value: 'health', label: 'Health & Wellness', description: 'Medical, fitness, beauty' },
  { value: 'construction', label: 'Construction & Trades', description: 'Building, plumbing, electrical' },
  { value: 'technology', label: 'Technology & IT', description: 'Software, hardware, support' },
  { value: 'education', label: 'Education & Training', description: 'Schools, courses, tutoring' },
  { value: 'automotive', label: 'Automotive', description: 'Car sales, repair, services' },
  { value: 'real-estate', label: 'Real Estate', description: 'Property sales, rentals' },
  { value: 'arts', label: 'Arts & Entertainment', description: 'Creative services, events' },
  { value: 'nonprofit', label: 'Non-Profit', description: 'Charities, associations' },
  { value: 'other', label: 'Other', description: 'Tell us more about your business' }
]

export function Step3BusinessBasics({ form, errors, isLoading }: StepComponentProps) {
  const t = useTranslations('onboarding.steps.3')
  const { control, setValue, watch } = form

  const selectedIndustry = watch('industry')

  const handleAddressSelect = (address: any) => {
    if (address) {
      setValue('address', address.formatted_address)
      setValue('city', address.locality || '')
      setValue('postalCode', address.postal_code || '')
      setValue('region', address.administrative_area_level_1 || '')
      setValue('country', address.country || '')
    }
  }

  return (
    <div className="space-y-8">
      {/* Business Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">{t('businessInfo.title')}</h3>
              <Badge variant="secondary" className="ml-auto">
                {t('businessInfo.required')}
              </Badge>
            </div>

            <div className="space-y-6">
              {/* Business Name */}
              <Controller
                name="businessName"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label={t('businessInfo.name.label')}
                    placeholder={t('businessInfo.name.placeholder')}
                    hint={t('businessInfo.name.hint')}
                    error={errors.businessName?.message}
                    required
                    disabled={isLoading}
                    leftIcon={<Building2 className="w-4 h-4" />}
                  />
                )}
              />

              {/* Industry */}
              <Controller
                name="industry"
                control={control}
                render={({ field }) => (
                  <DropdownInput
                    label={t('businessInfo.industry.label')}
                    placeholder={t('businessInfo.industry.placeholder')}
                    hint={t('businessInfo.industry.hint')}
                    options={industries}
                    value={field.value}
                    onValueChange={field.onChange}
                    error={errors.industry?.message}
                    required
                    searchable
                    disabled={isLoading}
                    name="industry"
                  />
                )}
              />

              {/* Custom Industry (if Other selected) */}
              {selectedIndustry === 'other' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Controller
                    name="customIndustry"
                    control={control}
                    render={({ field }) => (
                      <TextInput
                        {...field}
                        label={t('businessInfo.customIndustry.label')}
                        placeholder={t('businessInfo.customIndustry.placeholder')}
                        hint={t('businessInfo.customIndustry.hint')}
                        error={errors.customIndustry?.message}
                        required
                        disabled={isLoading}
                      />
                    )}
                  />
                </motion.div>
              )}

              {/* VAT Number (Italian specific) */}
              <Controller
                name="vatNumber"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label={t('businessInfo.vat.label')}
                    placeholder={t('businessInfo.vat.placeholder')}
                    hint={t('businessInfo.vat.hint')}
                    error={errors.vatNumber?.message}
                    disabled={isLoading}
                    leftIcon={<Hash className="w-4 h-4" />}
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contact Information */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">{t('contactInfo.title')}</h3>
              <Badge variant="secondary" className="ml-auto">
                {t('contactInfo.required')}
              </Badge>
            </div>

            <div className="space-y-6">
              {/* Phone Number */}
              <Controller
                name="businessPhone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    {...field}
                    label={t('contactInfo.phone.label')}
                    hint={t('contactInfo.phone.hint')}
                    error={errors.businessPhone?.message}
                    defaultCountry="IT"
                    required
                    disabled={isLoading}
                  />
                )}
              />

              {/* Website (optional) */}
              <Controller
                name="businessEmail"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label={t('contactInfo.email.label')}
                    placeholder={t('contactInfo.email.placeholder')}
                    hint={t('contactInfo.email.hint')}
                    error={errors.businessEmail?.message}
                    disabled={isLoading}
                    leftIcon={<Globe className="w-4 h-4" />}
                    type="email"
                    required
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Business Address */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">{t('address.title')}</h3>
              <Badge variant="secondary" className="ml-auto">
                {t('address.required')}
              </Badge>
            </div>

            <div className="space-y-6">
              {/* Address Autocomplete */}
              <Controller
                name="physicalAddress.street"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label={t('address.street.label')}
                    placeholder={t('address.street.placeholder')}
                    hint={t('address.street.hint')}
                    error={errors.physicalAddress?.street?.message}
                    required
                    disabled={isLoading}
                    leftIcon={<MapPin className="w-4 h-4" />}
                  />
                )}
              />

              {/* Additional Address Fields (populated by autocomplete) */}
              <div className="grid md:grid-cols-2 gap-4">
                <Controller
                  name="physicalAddress.city"
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      {...field}
                      label={t('address.city.label')}
                      placeholder={t('address.city.placeholder')}
                      error={errors.physicalAddress?.city?.message}
                      required
                      disabled={isLoading}
                      leftIcon={<MapPin className="w-4 h-4" />}
                    />
                  )}
                />

                <Controller
                  name="physicalAddress.postalCode"
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      {...field}
                      label={t('address.postalCode.label')}
                      placeholder={t('address.postalCode.placeholder')}
                      error={errors.physicalAddress?.postalCode?.message}
                      required
                      disabled={isLoading}
                      leftIcon={<Hash className="w-4 h-4" />}
                    />
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Controller
                  name="physicalAddress.province"
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      {...field}
                      label={t('address.region.label')}
                      placeholder={t('address.region.placeholder')}
                      error={errors.physicalAddress?.province?.message}
                      required
                      disabled={isLoading}
                    />
                  )}
                />

                <Controller
                  name="physicalAddress.country"
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      {...field}
                      label={t('address.country.label')}
                      placeholder={t('address.country.placeholder')}
                      error={errors.physicalAddress?.country?.message}
                      required
                      disabled={isLoading}
                      value="Italy" // Default for Italian market
                      readOnly
                    />
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Usage Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-xs text-muted-foreground"
      >
        <p>{t('dataUsage.notice')}</p>
      </motion.div>
    </div>
  )
}