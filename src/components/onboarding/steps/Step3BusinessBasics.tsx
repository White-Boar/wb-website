'use client'

import { useEffect, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
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
import industriesData from '@/data/industries.json'

// Country list - Italy only for business address
const countries = [
  { value: 'Italy', label: 'Italy', description: '🇮🇹 Italia' }
]

// Italian provinces (107 provinces) with their codes
const italianProvinces = [
  { value: 'AG', label: 'Agrigento', description: 'Sicilia' },
  { value: 'AL', label: 'Alessandria', description: 'Piemonte' },
  { value: 'AN', label: 'Ancona', description: 'Marche' },
  { value: 'AO', label: 'Aosta', description: "Valle d'Aosta" },
  { value: 'AP', label: 'Ascoli Piceno', description: 'Marche' },
  { value: 'AQ', label: "L'Aquila", description: 'Abruzzo' },
  { value: 'AR', label: 'Arezzo', description: 'Toscana' },
  { value: 'AT', label: 'Asti', description: 'Piemonte' },
  { value: 'AV', label: 'Avellino', description: 'Campania' },
  { value: 'BA', label: 'Bari', description: 'Puglia' },
  { value: 'BG', label: 'Bergamo', description: 'Lombardia' },
  { value: 'BI', label: 'Biella', description: 'Piemonte' },
  { value: 'BL', label: 'Belluno', description: 'Veneto' },
  { value: 'BN', label: 'Benevento', description: 'Campania' },
  { value: 'BO', label: 'Bologna', description: 'Emilia-Romagna' },
  { value: 'BR', label: 'Brindisi', description: 'Puglia' },
  { value: 'BS', label: 'Brescia', description: 'Lombardia' },
  { value: 'BT', label: 'Barletta-Andria-Trani', description: 'Puglia' },
  { value: 'BZ', label: 'Bolzano', description: 'Trentino-Alto Adige' },
  { value: 'CA', label: 'Cagliari', description: 'Sardegna' },
  { value: 'CB', label: 'Campobasso', description: 'Molise' },
  { value: 'CE', label: 'Caserta', description: 'Campania' },
  { value: 'CH', label: 'Chieti', description: 'Abruzzo' },
  { value: 'CL', label: 'Caltanissetta', description: 'Sicilia' },
  { value: 'CN', label: 'Cuneo', description: 'Piemonte' },
  { value: 'CO', label: 'Como', description: 'Lombardia' },
  { value: 'CR', label: 'Cremona', description: 'Lombardia' },
  { value: 'CS', label: 'Cosenza', description: 'Calabria' },
  { value: 'CT', label: 'Catania', description: 'Sicilia' },
  { value: 'CZ', label: 'Catanzaro', description: 'Calabria' },
  { value: 'EN', label: 'Enna', description: 'Sicilia' },
  { value: 'FC', label: 'Forlì-Cesena', description: 'Emilia-Romagna' },
  { value: 'FE', label: 'Ferrara', description: 'Emilia-Romagna' },
  { value: 'FG', label: 'Foggia', description: 'Puglia' },
  { value: 'FI', label: 'Firenze', description: 'Toscana' },
  { value: 'FM', label: 'Fermo', description: 'Marche' },
  { value: 'FR', label: 'Frosinone', description: 'Lazio' },
  { value: 'GE', label: 'Genova', description: 'Liguria' },
  { value: 'GO', label: 'Gorizia', description: 'Friuli-Venezia Giulia' },
  { value: 'GR', label: 'Grosseto', description: 'Toscana' },
  { value: 'IM', label: 'Imperia', description: 'Liguria' },
  { value: 'IS', label: 'Isernia', description: 'Molise' },
  { value: 'KR', label: 'Crotone', description: 'Calabria' },
  { value: 'LC', label: 'Lecco', description: 'Lombardia' },
  { value: 'LE', label: 'Lecce', description: 'Puglia' },
  { value: 'LI', label: 'Livorno', description: 'Toscana' },
  { value: 'LO', label: 'Lodi', description: 'Lombardia' },
  { value: 'LT', label: 'Latina', description: 'Lazio' },
  { value: 'LU', label: 'Lucca', description: 'Toscana' },
  { value: 'MB', label: 'Monza e Brianza', description: 'Lombardia' },
  { value: 'MC', label: 'Macerata', description: 'Marche' },
  { value: 'ME', label: 'Messina', description: 'Sicilia' },
  { value: 'MI', label: 'Milano', description: 'Lombardia' },
  { value: 'MN', label: 'Mantova', description: 'Lombardia' },
  { value: 'MO', label: 'Modena', description: 'Emilia-Romagna' },
  { value: 'MS', label: 'Massa-Carrara', description: 'Toscana' },
  { value: 'MT', label: 'Matera', description: 'Basilicata' },
  { value: 'NA', label: 'Napoli', description: 'Campania' },
  { value: 'NO', label: 'Novara', description: 'Piemonte' },
  { value: 'NU', label: 'Nuoro', description: 'Sardegna' },
  { value: 'OR', label: 'Oristano', description: 'Sardegna' },
  { value: 'PA', label: 'Palermo', description: 'Sicilia' },
  { value: 'PC', label: 'Piacenza', description: 'Emilia-Romagna' },
  { value: 'PD', label: 'Padova', description: 'Veneto' },
  { value: 'PE', label: 'Pescara', description: 'Abruzzo' },
  { value: 'PG', label: 'Perugia', description: 'Umbria' },
  { value: 'PI', label: 'Pisa', description: 'Toscana' },
  { value: 'PN', label: 'Pordenone', description: 'Friuli-Venezia Giulia' },
  { value: 'PO', label: 'Prato', description: 'Toscana' },
  { value: 'PR', label: 'Parma', description: 'Emilia-Romagna' },
  { value: 'PT', label: 'Pistoia', description: 'Toscana' },
  { value: 'PU', label: 'Pesaro e Urbino', description: 'Marche' },
  { value: 'PV', label: 'Pavia', description: 'Lombardia' },
  { value: 'PZ', label: 'Potenza', description: 'Basilicata' },
  { value: 'RA', label: 'Ravenna', description: 'Emilia-Romagna' },
  { value: 'RC', label: 'Reggio Calabria', description: 'Calabria' },
  { value: 'RE', label: 'Reggio Emilia', description: 'Emilia-Romagna' },
  { value: 'RG', label: 'Ragusa', description: 'Sicilia' },
  { value: 'RI', label: 'Rieti', description: 'Lazio' },
  { value: 'RM', label: 'Roma', description: 'Lazio' },
  { value: 'RN', label: 'Rimini', description: 'Emilia-Romagna' },
  { value: 'RO', label: 'Rovigo', description: 'Veneto' },
  { value: 'SA', label: 'Salerno', description: 'Campania' },
  { value: 'SI', label: 'Siena', description: 'Toscana' },
  { value: 'SO', label: 'Sondrio', description: 'Lombardia' },
  { value: 'SP', label: 'La Spezia', description: 'Liguria' },
  { value: 'SR', label: 'Siracusa', description: 'Sicilia' },
  { value: 'SS', label: 'Sassari', description: 'Sardegna' },
  { value: 'SU', label: 'Sud Sardegna', description: 'Sardegna' },
  { value: 'SV', label: 'Savona', description: 'Liguria' },
  { value: 'TA', label: 'Taranto', description: 'Puglia' },
  { value: 'TE', label: 'Teramo', description: 'Abruzzo' },
  { value: 'TN', label: 'Trento', description: 'Trentino-Alto Adige' },
  { value: 'TO', label: 'Torino', description: 'Piemonte' },
  { value: 'TP', label: 'Trapani', description: 'Sicilia' },
  { value: 'TR', label: 'Terni', description: 'Umbria' },
  { value: 'TS', label: 'Trieste', description: 'Friuli-Venezia Giulia' },
  { value: 'TV', label: 'Treviso', description: 'Veneto' },
  { value: 'UD', label: 'Udine', description: 'Friuli-Venezia Giulia' },
  { value: 'VA', label: 'Varese', description: 'Lombardia' },
  { value: 'VB', label: 'Verbano-Cusio-Ossola', description: 'Piemonte' },
  { value: 'VC', label: 'Vercelli', description: 'Piemonte' },
  { value: 'VE', label: 'Venezia', description: 'Veneto' },
  { value: 'VI', label: 'Vicenza', description: 'Veneto' },
  { value: 'VR', label: 'Verona', description: 'Veneto' },
  { value: 'VT', label: 'Viterbo', description: 'Lazio' },
  { value: 'VV', label: 'Vibo Valentia', description: 'Calabria' }
]

export function Step3BusinessBasics({ form, errors, isLoading }: StepComponentProps) {
  const t = useTranslations('onboarding.steps.3')
  const locale = useLocale()
  const { control, setValue, watch, trigger } = form

  const selectedIndustry = watch('industry')
  const businessCountry = watch('businessCountry')

  // Transform industries data based on locale
  const industries = useMemo(() => {
    return industriesData.map((industry) => ({
      value: industry.category.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
      label: locale === 'it' ? industry.category_it : industry.category,
      description: locale === 'it' ? industry.description_it : industry.description
    }))
  }, [locale])

  // Pre-select Italy if no country is set
  useEffect(() => {
    if (!businessCountry) {
      setValue('businessCountry', 'Italy', { shouldValidate: true })
    }
  }, [businessCountry, setValue])

  const handleAddressSelect = (address: any) => {
    if (address) {
      setValue('businessStreet', address.formatted_address)
      setValue('businessCity', address.locality || '')
      setValue('businessPostalCode', address.postal_code || '')
      setValue('businessProvince', address.administrative_area_level_1 || '')
      setValue('businessCountry', address.country || 'Italy')
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
              <h2 className="text-lg font-semibold text-foreground">{t('businessInfo.title')}</h2>
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
              <h2 className="text-lg font-semibold text-foreground">{t('contactInfo.title')}</h2>
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
              <h2 className="text-lg font-semibold text-foreground">{t('address.title')}</h2>
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
                    <DropdownInput
                      label={t('address.region.label')}
                      placeholder={t('address.region.placeholder')}
                      options={italianProvinces}
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        trigger('businessProvince')
                      }}
                      error={errors.businessProvince?.message}
                      required
                      searchable
                      clearable={false}
                      disabled={isLoading}
                      name="businessProvince"
                    />
                  )}
                />

                <Controller
                  name="businessCountry"
                  control={control}
                  defaultValue="Italy"
                  render={({ field }) => (
                    <DropdownInput
                      label={t('address.country.label')}
                      placeholder={t('address.country.placeholder')}
                      options={countries}
                      value={field.value || 'Italy'}
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