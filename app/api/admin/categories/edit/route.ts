import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { canAccessAdminArea } from '@/lib/permissions'
import { DEFAULT_SELLER_FIELDS, stringifyCategoryFieldConfig, type SellerFieldKey } from '@/lib/categoryFields'

function validateIcon(icon: string) {
  if (icon?.startsWith('data:image/') && icon.length > 500_000) {
    return 'Logo image is too large. Please use a compressed image under 350KB.'
  }
  return null
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user || !(await canAccessAdminArea(user.role, 'categories'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const icon = formData.get('icon') as string
    const color = formData.get('color') as string
    const description = formData.get('description') as string
    const defaultPrice = parseFloat(formData.get('defaultPrice') as string || '0')
    const videoUrl = (formData.get('videoUrl') as string) || ''
    const enabledFields = formData.getAll('enabledFields') as SellerFieldKey[]

    if (!id || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const iconError = validateIcon(icon)
    if (iconError) {
      return NextResponse.json({ error: iconError }, { status: 400 })
    }

    await prisma.category.update({
      where: { id },
      data: {
        name,
        icon,
        color,
        description,
        defaultPrice,
        fields: stringifyCategoryFieldConfig({
          enabledFields: enabledFields.length ? enabledFields : DEFAULT_SELLER_FIELDS,
          videoUrl,
        }),
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
