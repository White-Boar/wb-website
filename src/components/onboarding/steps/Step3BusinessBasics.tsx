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

// Countries list for dropdown (Italy first, then all European countries, then others)
const countries = [
  // Italy first (primary market)
  { value: 'Italy', label: 'Italy', description: '🇮🇹 Italia' },

  // European Union countries
  { value: 'Austria', label: 'Austria', description: '🇦🇹 Österreich' },
  { value: 'Belgium', label: 'Belgium', description: '🇧🇪 België' },
  { value: 'Bulgaria', label: 'Bulgaria', description: '🇧🇬 България' },
  { value: 'Croatia', label: 'Croatia', description: '🇭🇷 Hrvatska' },
  { value: 'Cyprus', label: 'Cyprus', description: '🇨🇾 Κύπρος' },
  { value: 'Czech Republic', label: 'Czech Republic', description: '🇨🇿 Česká republika' },
  { value: 'Denmark', label: 'Denmark', description: '🇩🇰 Danmark' },
  { value: 'Estonia', label: 'Estonia', description: '🇪🇪 Eesti' },
  { value: 'Finland', label: 'Finland', description: '🇫🇮 Suomi' },
  { value: 'France', label: 'France', description: '🇫🇷 France' },
  { value: 'Germany', label: 'Germany', description: '🇩🇪 Deutschland' },
  { value: 'Greece', label: 'Greece', description: '🇬🇷 Ελλάδα' },
  { value: 'Hungary', label: 'Hungary', description: '🇭🇺 Magyarország' },
  { value: 'Ireland', label: 'Ireland', description: '🇮🇪 Éire' },
  { value: 'Latvia', label: 'Latvia', description: '🇱🇻 Latvija' },
  { value: 'Lithuania', label: 'Lithuania', description: '🇱🇹 Lietuva' },
  { value: 'Luxembourg', label: 'Luxembourg', description: '🇱🇺 Lëtzebuerg' },
  { value: 'Malta', label: 'Malta', description: '🇲🇹 Malta' },
  { value: 'Netherlands', label: 'Netherlands', description: '🇳🇱 Nederland' },
  { value: 'Poland', label: 'Poland', description: '🇵🇱 Polska' },
  { value: 'Portugal', label: 'Portugal', description: '🇵🇹 Portugal' },
  { value: 'Romania', label: 'Romania', description: '🇷🇴 România' },
  { value: 'Slovakia', label: 'Slovakia', description: '🇸🇰 Slovensko' },
  { value: 'Slovenia', label: 'Slovenia', description: '🇸🇮 Slovenija' },
  { value: 'Spain', label: 'Spain', description: '🇪🇸 España' },
  { value: 'Sweden', label: 'Sweden', description: '🇸🇪 Sverige' },

  // Other European countries (non-EU)
  { value: 'Albania', label: 'Albania', description: '🇦🇱 Shqipëri' },
  { value: 'Andorra', label: 'Andorra', description: '🇦🇩 Andorra' },
  { value: 'Bosnia and Herzegovina', label: 'Bosnia and Herzegovina', description: '🇧🇦 BiH' },
  { value: 'Iceland', label: 'Iceland', description: '🇮🇸 Ísland' },
  { value: 'Kosovo', label: 'Kosovo', description: '🇽🇰 Kosovë' },
  { value: 'Liechtenstein', label: 'Liechtenstein', description: '🇱🇮 Liechtenstein' },
  { value: 'Macedonia', label: 'Macedonia', description: '🇲🇰 Македонија' },
  { value: 'Moldova', label: 'Moldova', description: '🇲🇩 Moldova' },
  { value: 'Monaco', label: 'Monaco', description: '🇲🇨 Monaco' },
  { value: 'Montenegro', label: 'Montenegro', description: '🇲🇪 Crna Gora' },
  { value: 'Norway', label: 'Norway', description: '🇳🇴 Norge' },
  { value: 'San Marino', label: 'San Marino', description: '🇸🇲 San Marino' },
  { value: 'Serbia', label: 'Serbia', description: '🇷🇸 Србија' },
  { value: 'Switzerland', label: 'Switzerland', description: '🇨🇭 Schweiz' },
  { value: 'Ukraine', label: 'Ukraine', description: '🇺🇦 Україна' },
  { value: 'United Kingdom', label: 'United Kingdom', description: '🇬🇧 UK' },
  { value: 'Vatican City', label: 'Vatican City', description: '🇻🇦 Vaticano' },

  // Major non-European countries
  { value: 'United States', label: 'United States', description: '🇺🇸 USA' },
  { value: 'Canada', label: 'Canada', description: '🇨🇦 Canada' },
  { value: 'Australia', label: 'Australia', description: '🇦🇺 Australia' },
  { value: 'Japan', label: 'Japan', description: '🇯🇵 日本' },
  { value: 'China', label: 'China', description: '🇨🇳 中国' },
  { value: 'India', label: 'India', description: '🇮🇳 भारत' },
  { value: 'Brazil', label: 'Brazil', description: '🇧🇷 Brasil' },
  { value: 'Mexico', label: 'Mexico', description: '🇲🇽 México' },
  { value: 'Argentina', label: 'Argentina', description: '🇦🇷 Argentina' },
  { value: 'South Africa', label: 'South Africa', description: '🇿🇦 South Africa' },
  { value: 'New Zealand', label: 'New Zealand', description: '🇳🇿 Aotearoa' },
  { value: 'South Korea', label: 'South Korea', description: '🇰🇷 한국' },
  { value: 'Turkey', label: 'Turkey', description: '🇹🇷 Türkiye' },
  { value: 'Russia', label: 'Russia', description: '🇷🇺 Россия' },
  { value: 'United Arab Emirates', label: 'United Arab Emirates', description: '🇦🇪 UAE' }
]

export function Step3BusinessBasics({ form, errors, isLoading }: StepComponentProps) {
  const t = useTranslations('onboarding.steps.3')
  const { control, setValue, watch, trigger } = form

  const selectedIndustry = watch('industry')

  const handleAddressSelect = (address: any) => {
    if (address) {
      setValue('businessStreet', address.formatted_address)
      setValue('businessCity', address.locality || '')
      setValue('businessPostalCode', address.postal_code || '')
      setValue('businessProvince', address.administrative_area_level_1 || '')
      setValue('businessCountry', address.country || '')
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
                    onValueChange={(value) => {
                      field.onChange(value)
                      trigger('industry')
                    }}
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
                name="businessStreet"
                control={control}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    label={t('address.street.label')}
                    placeholder={t('address.street.placeholder')}
                    hint={t('address.street.hint')}
                    error={errors.businessStreet?.message}
                    required
                    disabled={isLoading}
                    leftIcon={<MapPin className="w-4 h-4" />}
                  />
                )}
              />

              {/* Additional Address Fields (populated by autocomplete) */}
              <div className="grid md:grid-cols-2 gap-4">
                <Controller
                  name="businessCity"
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      {...field}
                      label={t('address.city.label')}
                      placeholder={t('address.city.placeholder')}
                      error={errors.businessCity?.message}
                      required
                      disabled={isLoading}
                      leftIcon={<MapPin className="w-4 h-4" />}
                    />
                  )}
                />

                <Controller
                  name="businessPostalCode"
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      {...field}
                      label={t('address.postalCode.label')}
                      placeholder={t('address.postalCode.placeholder')}
                      error={errors.businessPostalCode?.message}
                      required
                      disabled={isLoading}
                      leftIcon={<Hash className="w-4 h-4" />}
                    />
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Controller
                  name="businessProvince"
                  control={control}
                  render={({ field }) => (
                    <TextInput
                      {...field}
                      label={t('address.region.label')}
                      placeholder={t('address.region.placeholder')}
                      error={errors.businessProvince?.message}
                      required
                      disabled={isLoading}
                    />
                  )}
                />

                <Controller
                  name="businessCountry"
                  control={control}
                  render={({ field }) => (
                    <DropdownInput
                      label={t('address.country.label')}
                      placeholder={t('address.country.placeholder')}
                      options={countries}
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        // Trigger form validation after setting the value
                        trigger('businessCountry')
                      }}
                      error={errors.businessCountry?.message}
                      required
                      searchable
                      clearable={false} // Disable clear button since country is required
                      disabled={isLoading}
                      name="businessCountry"
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