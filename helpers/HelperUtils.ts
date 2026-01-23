import { Error } from "@/models/common";
import { AxiosError } from 'axios';

export function copyMatchingKeyValues(target: any, source: any) {
    Object.keys(target).forEach(key => {
        if (source[key] !== undefined)
            target[key] = source[key];
    });
    return target;
}

export function appendOperator(text: string, appendText: string, operator: string = ';') {
    if (text === '') return text.concat(appendText)
    return text.concat(operator).concat(appendText)
}

export function capitalizeSentence(sentence: string) {
    return sentence.toLocaleLowerCase('tr-TR').replace(/(?:^|\s|,|;|!|:|-|\.|\?)[a-z0-9ğçşüöı]/g, letter => letter.toUpperCase());
}

// Türkçe karakterleri doğru şekilde uppercase yapan function
export function turkishToUpperCase(text: string): string {
    const turkishUpperCaseMap: { [key: string]: string } = {
        'i': 'İ',
        'ş': 'Ş',
        'ğ': 'Ğ',
        'ü': 'Ü',
        'ö': 'Ö',
        'ç': 'Ç',
    };
    
    return text
        .split('')
        .map(char => turkishUpperCaseMap[char] || char.toUpperCase())
        .join('');
}

export function getErrorMessage(error: any) {
    const axiosError = (error as AxiosError<any>);
    const errorData = axiosError.response?.data;
    
    // Önce backend'den gelen spesifik hata mesajlarını kontrol et
    if (errorData !== undefined && errorData !== null) {
        if (errorData.errorMessage) {
            return errorData.errorMessage;
        }
        if (errorData.message) {
            return errorData.message;
        }
        if (errorData.error) {
            return errorData.error;
        }
        // Eğer errorData string ise direkt döndür
        if (typeof errorData === 'string') {
            return errorData;
        }
    }
    
    // Axios error mesajını kontrol et
    if (axiosError.message) {
        return axiosError.message;
    }
    
    // Son çare olarak genel mesaj
    return "Bir hata oluştu";
}

export const allowOnlyNumbers = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"];
  
    if (!((e.key >= "0" && e.key <= "9") || allowedKeys.includes(e.key))) {
      e.preventDefault();
    }
  };