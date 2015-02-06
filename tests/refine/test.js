// создаем базовый компонент
var baseComponent = new SP.Component();

		console.log('Количество компонентов в распоряжении:', baseComponent.components.length);

var count = 100;

		console.time('Добавлено ' + count + ' компонентов за');

for(var tick = 0; tick < count; tick++) {
  // создаем дочерний компонент
  var comp = new SP.Component();
  // владельцем которого будет базовый компонент
  comp.owner = baseComponent;
}

		console.timeEnd('Добавлено ' + count + ' компонентов за');

// количество дочерних компонентов которыми владеет базовый компонет
var compLength = baseComponent.components.length;

		console.log('Количество компонентов в распоряжении:', compLength);
		console.time('Удалено ' + compLength + ' компонентов за');

// массив дочерних компонентов
var components = baseComponent.components;
while(components.length) {
  // убираем владельца у каждого дочернего компонента
  components.shift().owner = null;
}

		console.timeEnd('Удалено ' + compLength + ' компонентов за');

		console.log('Количество компонентов в распоряжении:', baseComponent.components.length);
