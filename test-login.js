const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function test() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('✅ User found:', user.email)
    console.log('Hash:', user.hashedPassword)
    
    const valid = await bcrypt.compare('Admin@123', user.hashedPassword)
    console.log('Password valid:', valid)
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

test()
