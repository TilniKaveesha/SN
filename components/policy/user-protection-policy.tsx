"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Download, X } from "lucide-react"

export function UserProtectionPolicy() {
  const [isOpen, setIsOpen] = useState(false)

  const policyContent = {
    title: "ទម្រង់កិច្ចការពារអ្នកប្រើប្រាស់",
    titleEn: "User Protection & Refund Policy",
    sections: [
      {
        title: "ព្រះរាជាណាចក្រកម្ពុជា",
        titleEn: "Kingdom of Cambodia",
        content: "ជាតិ សាសនា ព្រះមហាក្សត្រ",
      },
      {
        title: "ព័ត៌មានលម្អិត",
        titleEn: "Company Details",
        content: `ម្ចាស់អាជីវកម្ម៖ GUNASINGHA KASSAPA GAMINI
ភេទ៖ ប្រុស, អាយុ៖ ៤៨ ឆ្នាំ
ថ្ងៃខែឆ្នាំកំណើត៖ ១៥ មីនា ១៩៧៧
សញ្ជាតិ៖ ស្រីលង្កា
លេខលិខិតឆ្លងដែន៖ N7811761
ក្រុមហ៊ុន៖ ជីខេ ស្មាត (GK SMART)
គេហទំព័រ៖ www.startupnest.biz
អត្តលេខសហគ្រាស៖ ៥០០១៥៧៣២
ថ្ងៃចុះបញ្ជីពាណិជ្ជកម្ម៖ ១៣ មេសា ២០២១`,
      },
      {
        title: "គោលបំណង",
        titleEn: "Purpose",
        content: `ទម្រង់កិច្ចការពារអ្នកប្រើប្រាស់នេះចែងឡើងមានគោលបំណងដើម្បី៖
• បង្ហាញពីសុចរិតភាពនៃការប្រកបអាជីវកម្ម
• ផ្តល់ទំនុកចិត្តដល់អ្នកទិញឬអ្នកប្រើប្រាស់`,
      },
      {
        title: "ប្រការ ១. និយមន័យ",
        titleEn: "Section 1: Definitions",
        content: `ម្ចាស់ដើមនៃទំនិញ៖ បុគ្គល ឬនីតិបុគ្គលដែលជាម្ចាស់ស្របច្បាប់នៃទំនិញ

អ្នកលក់៖ នីតិបុគ្គលដែលទិញទំនិញពីម្ចាស់ដើម ដើម្បីលក់បន្តឲ្យអ្នកទិញ

អ្នកទិញ៖ បុគ្គលដែលទិញទំនិញពីអ្នកលក់ដើម្បីប្រើប្រាស់ផ្ទាល់`,
      },
      {
        title: "ប្រការ ៦. ការកំនត់ទំនួលខុសត្រូវ",
        titleEn: "Section 6: Liability",
        content: `យើងខ្ញុំមិនទទួលខុសត្រូវចំពោះការខូចខាត ឬការបាត់បង់ណាមួយដែលបណ្តាលមកពីការប្រើប្រាស់ទំនិញឡើយ។

ករណីទំនិញនោះបង្កគ្រោះថ្នាក់ដល់អាយុជីវិត យើងខ្ញុំនឹងទទួលខុសត្រូវតាមច្បាប់ជាធរមាន។`,
      },
      {
        title: "ប្រការ ៧. វិធានដោះស្រាយវិវាទ",
        titleEn: "Section 7: Dispute Resolution",
        content: `រាល់វិវាទ ឬការខុសគ្នាដែលកើតឡើងទាក់ទងនឹងទំនិញ អ្នកទិញ និងអ្នកលក់ត្រូវដោះស្រាយដោយសន្តិវិធីជាមុនសិន។

ប្រសិនបើមិនអាចដោះស្រាយបាន ភាគីណាមួយអាចប្តឹងទៅតុលាការដើម្បីដោះស្រាយតាមច្បាប់ជាធរមាន។`,
      },
      {
        title: "ប្រការ ៨. ការកែប្រែលក្ខខណ្ឌ",
        titleEn: "Section 8: Amendment of Terms",
        content: `យើងខ្ញុំរក្សាសិទ្ធិក្នុងការកែប្រែលក្ខខណ្ឌទាំងនេះនៅពេលណាក៏បាន ដោយធ្វើការជូនដំណឹងជាមុនដល់អ្នកប្រើប្រាស់។

ការបន្តប្រើប្រាស់សេវាកម្មបន្ទាប់ពីមានការកែប្រែ ចាត់ទុកជាការយល់ព្រមលើលក្ខខណ្ឌដែលបានកែប្រែ។`,
      },
      {
        title: "ប្រការ ៩. ច្បាប់ដែលអនុវត្ត",
        titleEn: "Section 9: Applicable Law",
        content: `លក្ខខណ្ឌទាំងនេះ ស្ថិតនៅក្រោមច្បាប់នៃព្រះរាជាណាចក្រកម្ពុជា។

រាល់វិវាទដែលកើតឡើង ត្រូវដោះស្រាយតាមច្បាប់កម្ពុជា។`,
      },
      {
        title: "ការបង់ប្រាក់និងការដឹកជញ្ជូន",
        titleEn: "Payment & Delivery",
        content: `វិធីបង់ប្រាក់៖
• បង់ប្រាក់តាមរយៈធនាគារ ABA
• បង់ប្រាក់តាមរយៈធនាគារ Wing
• បង់ប្រាក់ជាសាច់ប្រាក់ដោយផ្ទាល់ ពេលដែលទទួលទំនិញ

ការដឹកជញ្ជូន៖
• ក្រោយពីទូទាត់ប្រាក់រួចរាល់ ក្រុមការងាររបស់យើងនឹងធ្វើការដឹកជញ្ជូនទំនិញ
• អ្នកទិញអាចជ្រើសរើសការដឹកជញ្ជូនដោយខ្លួនឯង ឬអោយក្រុមហ៊ុនដឹកជញ្ជូនអោយ
• ការដឹកជញ្ជូនត្រូវគិតថ្លៃសេវាតាមទីតាំងរបស់អ្នកទិញ`,
      },
      {
        title: "ប្រការ ៧. ភាពសម្ងាត់នៃព័ត៌មាន",
        titleEn: "Section 7: Customer Information Privacy",
        content: `យើងរក្សាទុក និងប្រើប្រាស់ព័ត៌មានអតិថិជនតែសម្រាប់គោលបំណងទិញលក់ប៉ុណ្ណោះ។

ហាមមិនឱ្យបញ្ចេញឬប្រើប្រាស់សម្រាប់គោលបំណងផ្សេងទៀតឡើយ។`,
      },
    ],
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto gap-2 border-blue-200 hover:bg-blue-50 bg-transparent">
          <FileText className="h-4 w-4" />
          View Policy
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">{policyContent.titleEn}</DialogTitle>
              <p className="text-lg font-semibold text-gray-700 mt-1">{policyContent.title}</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-6 px-6 py-4">
          {policyContent.sections.map((section, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{section.title}</h3>
              <p className="text-sm text-gray-500 mb-2 italic">{section.titleEn}</p>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{section.content}</p>
            </div>
          ))}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
            <p className="text-sm text-gray-700">
              <strong>សូមអរគុណ</strong> ចំពោះការអាន និងគោរពតាមលក្ខខណ្ឌរបស់យើងខ្ញុំ។
            </p>
            <p className="text-sm text-gray-600 mt-2">Thank you for reading and respecting our terms and conditions.</p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4 flex gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
            Close
          </Button>
          <Button
            variant="default"
            className="flex-1 gap-2"
            onClick={() => {
              // Download functionality can be added here
              const element = document.createElement("a")
              const file = new Blob(
                [policyContent.sections.map((s) => `${s.title}\n${s.titleEn}\n\n${s.content}`).join("\n\n---\n\n")],
                { type: "text/plain" },
              )
              element.href = URL.createObjectURL(file)
              element.download = "User-Protection-Policy.txt"
              document.body.appendChild(element)
              element.click()
              document.body.removeChild(element)
            }}
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
