/* eslint-disable @typescript-eslint/no-unused-vars */
import { Middleware, PayloadAction } from "@reduxjs/toolkit";

const termsStorageMiddleware: Middleware = store => next => action => {
    const result = next(action);
    console.log("termsStorageMiddleware next returned: " + result)

    // store terms to localStorage
    if ((action as PayloadAction).type.startsWith('terms')) {
      const terms = store.getState()
    }
}