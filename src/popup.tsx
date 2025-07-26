import {
    ClerkProvider,
    SignedIn,
    SignedOut,
    SignInButton,
    UserButton
} from "@clerk/chrome-extension"
import React from "react"

const PUBLISHABLE_KEY = process.env.PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY
const CLERK_SYNC_HOST = process.env.PLASMO_PUBLIC_CLERK_SYNC_HOST

if (!PUBLISHABLE_KEY) {
    throw new Error("Missing Publishable Key")
}

function IndexPopup() {
    // const navigate = useNavigate()
    return (
        // <MemoryRouter>
        <ClerkProvider
            // routerPush={(to) => navigate(to)}
            // routerReplace={(to) => navigate(to, { replace: true })}
            publishableKey={PUBLISHABLE_KEY}
            syncHost={CLERK_SYNC_HOST}>
            <p>extension</p>
            <div className="wf-flex wf-items-center wf-justify-center wf-h-16 wf-w-40">
                <header className="header">
                    <p>hello</p>
                    <SignedOut>
                        <SignInButton mode="modal" />
                    </SignedOut>
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                </header>
            </div>
        </ClerkProvider>
        // </MemoryRouter>
    )
}

export default IndexPopup