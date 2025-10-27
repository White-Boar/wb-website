#!/usr/bin/env python3
"""
Remove verbose debug console.log messages from E2E test files.
Keeps: console.warn, console.error, and essential test outcome messages.
Removes: Step-by-step progress messages with emojis.
"""

import re
import sys

def should_keep_log(line):
    """Determine if a console.log line should be kept."""
    # Always keep warnings and errors
    if 'console.warn' in line or 'console.error' in line:
        return True

    # Keep messages about test outcomes
    keep_patterns = [
        'test PASSED',
        'test FAILED',
        'test failed',
        'Failed to navigate',
        'Webhook not processed',
    ]

    for pattern in keep_patterns:
        if pattern in line:
            return True

    # Remove verbose progress messages
    remove_patterns = [
        '📍 Step',
        '✓ Filled',
        '✓ Selected',
        '✓ Clicked',
        '⏳ Waiting',
        '✓ Stripe',
        '✓ Card',
        '✓ Expiry',
        '✓ CVC',
        '✓ Payment',
        '✓ Redirected',
        '✓ Terms',
        '✓ Pricing',
        '✓ Database',
        '✓ Submission',
        '✓ Language',
        '✓ Navigated',
        '✓ Session',
        '✓ Test Email',
        '✓ localStorage',
        '✓ Discount',
        '✓ Apply button',
        '✓ Error message',
        '✓ User remains',
        '✓ Success message',
        '✓ Price',
        '✓ Entered',
        '✓ Logo',
        '✓ Country',
        '✓ Opened',
        '✓ Added',
        '🎯 Selecting',
        '🎯 Selected',
        '📝 CRITICAL',
        '📁 Skipping',
        '📁 Testing',
        '🌍 Selecting',
        '📊 Found',
        '🧹 Test',
        '🎨 Clicked',
        '📸 Clicked',
        '📋 Selected',
        'Current URL',
        'Found province',
        'Found checkbox',
        'Label 0:',
        'Label 1:',
        'Label 2:',
        'Found.*cards',
        '🔍 Checking available',
        '📍 Filling address',
        '📍 Selecting province',
        '📋 Verifying filled',
        '📝 Console messages',
        'Field:',
        'Found.*comboboxes',
        '🚀 Starting complete',
        '⏳ Checking for session',
        'localStorage keys',
        'wb-onboarding-store',
        'Parsed store',
        'Has state',
        'Has sessionId',
    ]

    for pattern in remove_patterns:
        if pattern in line:
            return False

    # Keep other console.log statements (rare important ones)
    return True

def clean_file(filepath):
    """Remove verbose console.log lines from a file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    cleaned_lines = []
    removed_count = 0

    for line in lines:
        # Check if this is a console.log line
        if re.search(r'console\.log\(', line):
            if should_keep_log(line):
                cleaned_lines.append(line)
            else:
                removed_count += 1
                # Keep the line structure but make it empty (preserve line numbers for debugging)
                # cleaned_lines.append('\n')
        else:
            cleaned_lines.append(line)

    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(cleaned_lines)

    print(f"Cleaned {filepath}: removed {removed_count} verbose console.log statements")

if __name__ == '__main__':
    files = [
        'src/__tests__/e2e/step14-payment-flow.spec.ts',
        'src/__tests__/e2e/step12-ui-restoration.spec.ts',
        'src/__tests__/e2e/onboarding-flow-complete.spec.ts',
    ]

    for filepath in files:
        try:
            clean_file(filepath)
        except Exception as e:
            print(f"Error cleaning {filepath}: {e}", file=sys.stderr)
