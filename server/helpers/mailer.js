import sgMail from '@sendgrid/mail'

// Example data
// data = {
//   recipient: 'email@email.com',
//   name: 'JoeSmoe',
// }

export default {
  // Password Reset
  // d-c8686b423f3c4d989406a3410f76d9ce
  sendPasswordReset: async data => {
    try {
      const msg = {
        to: data.recipient,
        from: {
          email: process.env.FROM_EMAIL,
          name: 'Boiler'
        },
        templateId: 'd-c8686b423f3c4d989406a3410f76d9ce',
        dynamicTemplateData: {
          name: data.name,
          link: data.link
        }
      }

      await sgMail.send(msg)
    } catch (error) {
      console.log(error)
    }
  },

  // Password Updated
  //   d-a5ba38b625d040eabe8396c1873b9bc9
  sendPasswordUpdated: async data => {
    try {
      const msg = {
        to: data.recipient,
        from: {
          email: process.env.FROM_EMAIL,
          name: 'Boiler'
        },
        templateId: 'd-a5ba38b625d040eabe8396c1873b9bc9',
        dynamicTemplateData: {
          name: data.name
        }
      }

      const response = await sgMail.send(msg)
      return response
    } catch (error) {
      console.error('Error sending email:', error)
      if (error.response) {
        console.error(error.response.body)
      }
      throw error // Re-throw the error so the calling function knows there was a problem
    }
  },

  // Support Message Sent
  // d-bf07c796f45a41019d4800b1f070e831
  sendMessageSent: async data => {
    try {
      const msg = {
        to: data.recipient,
        from: {
          email: process.env.FROM_EMAIL,
          name: 'Boiler'
        },
        templateId: 'd-bf07c796f45a41019d4800b1f070e831',
        dynamicTemplateData: {
          name: data.name,
          message: data.message
        }
      }

      const response = await sgMail.send(msg)
      return response
    } catch (error) {
      console.error('Error sending email:', error)
      if (error.response) {
        console.error(error.response.body)
      }
      throw error // Re-throw the error so the calling function knows there was a problem
    }
  },

  // Send Message Received
  // d-2d8306a52fc347389e63b38528abedc8
  sendMessageReceived: async data => {
    try {
      const msg = {
        to: data.recipient,
        from: {
          email: process.env.FROM_EMAIL,
          name: 'Boiler',
          reply: data.reply
        },
        templateId: 'd-2d8306a52fc347389e63b38528abedc8',
        dynamicTemplateData: {
          name: data.name,
          category: data.category,
          message: data.message
        }
      }

      const response = await sgMail.send(msg)
      return response
    } catch (error) {
      console.error('Error sending email:', error)
      if (error.response) {
        console.error(error.response.body)
      }
      throw error // Re-throw the error so the calling function knows there was a problem
    }
  }
}
