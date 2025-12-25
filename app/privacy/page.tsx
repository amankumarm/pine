import { Navbar } from "@/components/navbar";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-zinc-900 selection:bg-zinc-100">
      <Navbar showAuth={true} />
      <div className="container mx-auto max-w-3xl py-12 px-4 lg:py-24">
        <h1 className="mb-8 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">Privacy Policy</h1>
        <div className="prose prose-lg prose-zinc max-w-none text-zinc-500 selection:bg-zinc-100 prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-zinc-900">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2>1. Information We Collect</h2>
          <p>
            We collect several different types of information for various purposes to provide and improve our Service to you.
          </p>
          <ul>
            <li><strong>Personal Data:</strong> While using our Service, we may ask you to provide us with certain personally identifiable information (e.g., email address, name).</li>
            <li><strong>Usage Data:</strong> We may also collect information on how the Service is accessed and used (e.g., IP address, browser type, pages visited).</li>
          </ul>

          <h2>2. Use of Data</h2>
          <p>Pine uses the collected data for various purposes:</p>
          <ul>
            <li>To provide and maintain the Service</li>
            <li>To notify you about changes to our Service</li>
            <li>To provide customer care and support</li>
            <li>To monitor the usage of the Service</li>
            <li>To detect, prevent and address technical issues</li>
          </ul>

          <h2>3. Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>

          <h2>4. Data Security</h2>
          <p>
            The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure.
          </p>

          <h2>5. Service Providers</h2>
          <p>
            We may employ third party companies and individuals to facilitate our Service ("Service Providers"), to provide the Service on our behalf, to perform Service-related services or to assist us in analyzing how our Service is used.
          </p>

          <h2>6. Links to Other Sites</h2>
          <p>
            Our Service may contain links to other sites that are not operated by us. If you click on a third party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit.
          </p>

          <h2>7. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us.
          </p>
        </div>
      </div>
    </div>
  );
}
