// Đối tượng `Validator`
function Validator(options) {
    // Lấy thằng cha từ thằng con có từ khóa là 'selector'
    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }
    // Lưu trữ các rules
    var selectorRules = {};

    // Hàm thực hiện validate
    function validate(inputElement, rule) {
        // tìm element form group từ hàm getParent() ;
        var formGroupElement = getParent(inputElement, options.formGroupSelector);

        var errorElement = formGroupElement.querySelector(options.errorSelector);

        var errorMessage;
        
        // Lấy ra các rules của selector
        var rules = selectorRules[rule.selector];

        // Lặp qua từng rule & kiểm tra
        // Nếu có lỗi thì dừng việc kiểm
        for (var i = 0; i < rules.length; i++) {
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }
            if (errorMessage) break;
        }
        if (errorMessage) {
            formGroupElement.classList.add('invalid');
            errorElement.innerText = errorMessage;
        } else {
            formGroupElement.classList.remove('invalid');
            errorElement.innerText = '';
        }
        return !errorMessage;
    }

    // Hàm xử lý submit form 
    function submitForm(form) {
        var isFormValid = true;

        // Lặp qua từng rules và validate
        options.rules.forEach(rule => {
            var inputElement = form.querySelector(rule.selector);
            var isValid = validate(inputElement, rule);
            if (!isValid) {
                isFormValid = false;
            }
        })
        

       if (isFormValid){
            // Trường hợp submit với javascript
            if (typeof options.onSubmit === 'function') {
                var enableInputs = form.querySelectorAll('[name]');
                var formValues = Array.from(enableInputs).reduce(function (values, input) {
                    
                    switch(input.type) {
                        case 'radio':
                            values[input.name] = form.querySelector('input[name="' + input.name + '"]:checked').value;
                            break;
                        case 'checkbox':
                            if (!input.matches(':checked')) {
                                values[input.name] = '';
                                return values;
                            }
                            if (!Array.isArray(values[input.name])) {
                                values[input.name] = [];
                            }
                            values[input.name].push(input.value);
                            break;
                        case 'file':
                            values[input.name] = input.files;
                            break;
                        default:
                            values[input.name] = input.value;
                    }

                    return values;
                }, {});
                options.onSubmit(formValues);
            }
             // Trường hợp submit với hành vi mặc định
            else{
                form.submit()
            }
       }
    }
    // Lấy element của form cần validate
    var formElement = document.querySelector(options.form);

    if (formElement) {
        // Khi submit form
        formElement.addEventListener('submit', function(e){       
            e.preventDefault();
            submitForm(this);

        });

        options.rules.forEach(rule => {
            // Array.isArray : check xem inputElement.selector có phải là mảng hay không ?
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } else {
                selectorRules[rule.selector] = [rule.test];
            }

            // inputElements : lấy tất cả các input element có selector tương ứng với rule.selector (node list)
            var inputElements = formElement.querySelectorAll(rule.selector);

            // Duyệt tất cả các input element(chuyển đổi node list -> Arrays) + xử lý sự kiện blur, input,...
            Array.from(inputElements).forEach(inputElement => {
                inputElement.addEventListener('blur', () => validate(inputElement, rule));

                inputElement.addEventListener('input', () => validate(inputElement, rule));

                inputElement.addEventListener('change', () => validate(inputElement, rule));
            })

        })

    }

}

// Định nghĩa rules
// Nguyên tắc của các rules:
// 1. Khi có lỗi => Trả ra message lỗi
// 2. Khi hợp lệ => Không trả ra cái gì cả (undefined)

// viết theo ES6 
Validator.isRequired = function (selector, message = 'Vui lòng nhập trường này') {
    return {
        selector,
        test(value) {
            return value ? undefined : message;
        },

    }

}

Validator.isEmail = function (selector, message = 'Trường này phải là email') {
    return {
        selector: selector,
        test: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : message;
        }
    };
}

Validator.minLength = function (selector, min, message = `Vui lòng nhập ít nhất ${min} ký tự`) {
    return {
        selector: selector,
        test: function (value) {
            return value.length >= min ? undefined :  message;
        }
    };

}


Validator.isConfirmed = function (selector, getConfirmValue, message = 'Giá trị nhập vào không chính xác') {
    return {
        selector: selector,
        test: function (value) {
            return value === getConfirmValue() ? undefined : message ;
        }
    }
}
